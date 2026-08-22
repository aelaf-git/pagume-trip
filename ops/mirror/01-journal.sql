-- Offline change journal for the local mirror.
-- Applied to the mirror ONLY; Neon's schema is never touched.
--
-- Every write made while the API is running against the mirror is captured here
-- so pagume-db-sync can replay it to Neon once connectivity returns.
-- Re-runnable: safe to apply after each pg_restore.

CREATE TABLE IF NOT EXISTS sync_journal (
    id          bigserial PRIMARY KEY,
    table_name  text        NOT NULL,
    op          text        NOT NULL CHECK (op IN ('INSERT', 'UPDATE', 'DELETE')),
    pk          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    row_data    jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    pushed_at   timestamptz,
    push_error  text
);

-- The replay reads pending entries in id order.
CREATE INDEX IF NOT EXISTS sync_journal_pending_idx
    ON sync_journal (id)
    WHERE pushed_at IS NULL;

-- Primary key columns arrive as trigger arguments, so no catalog lookup per row.
CREATE OR REPLACE FUNCTION sync_journal_capture() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    payload jsonb;
    pk      jsonb := '{}'::jsonb;
    i       int;
BEGIN
    IF TG_OP = 'DELETE' THEN
        payload := to_jsonb(OLD);
    ELSE
        payload := to_jsonb(NEW);
    END IF;

    IF TG_NARGS > 0 THEN
        FOR i IN 0 .. TG_NARGS - 1 LOOP
            pk := pk || jsonb_build_object(TG_ARGV[i], payload -> TG_ARGV[i]);
        END LOOP;
    END IF;

    INSERT INTO sync_journal (table_name, op, pk, row_data)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        pk,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE payload END
    );

    RETURN NULL;
END;
$fn$;

DO $attach$
DECLARE
    tbl      record;
    pk_cols  text[];
    args     text;
BEGIN
    FOR tbl IN
        SELECT c.oid, c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname NOT IN ('sync_journal', 'spatial_ref_sys', 'alembic_version')
        ORDER BY c.relname
    LOOP
        SELECT array_agg(a.attname ORDER BY k.ord)
          INTO pk_cols
        FROM pg_index i
        CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE i.indrelid = tbl.oid
          AND i.indisprimary;

        IF pk_cols IS NULL THEN
            -- No primary key: still journalled, but replay can only insert it.
            args := '';
            RAISE NOTICE 'sync_journal: % has no primary key, replay will insert only', tbl.relname;
        ELSE
            SELECT string_agg(quote_literal(col), ', ')
              INTO args
            FROM unnest(pk_cols) AS col;
        END IF;

        EXECUTE format('DROP TRIGGER IF EXISTS zz_sync_journal ON public.%I', tbl.relname);
        EXECUTE format(
            'CREATE TRIGGER zz_sync_journal AFTER INSERT OR UPDATE OR DELETE ON public.%I '
            'FOR EACH ROW EXECUTE FUNCTION sync_journal_capture(%s)',
            tbl.relname,
            args
        );
    END LOOP;
END
$attach$;
