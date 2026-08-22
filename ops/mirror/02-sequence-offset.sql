-- Push every mirror sequence above 1e9 so offline-generated IDs can never
-- collide with the low IDs Neon keeps handing out while we are offline.
--
-- Replay then inserts offline rows with their original IDs, which keeps all
-- foreign keys intact without any remapping. Explicit-ID inserts do not advance
-- Neon's own sequences, so the two ranges stay separate.
--
-- Mirror ONLY. Re-runnable: never lowers a sequence.

DO $offset$
DECLARE
    r      record;
    target bigint;
BEGIN
    FOR r IN
        SELECT schemaname, sequencename, COALESCE(last_value, 0) AS last_value
        FROM pg_sequences
        WHERE schemaname = 'public'
        ORDER BY sequencename
    LOOP
        target := GREATEST(1000000000::bigint, r.last_value);
        IF target <> r.last_value THEN
            PERFORM setval(format('%I.%I', r.schemaname, r.sequencename), target, true);
            RAISE NOTICE 'sequence % moved to offline range (was %)', r.sequencename, r.last_value;
        END IF;
    END LOOP;
END
$offset$;
