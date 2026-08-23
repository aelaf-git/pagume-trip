"""Replay writes that happened on the local mirror back to Neon.

The mirror's ``sync_journal`` table (see ops/mirror/01-journal.sql) records every
insert, update, and delete made while the API was offline. This module walks
those entries in ``id`` order and applies them to the primary database.

Ordering matters: the journal is chronological, so parents are always replayed
before their children and foreign keys hold. Each entry is applied in its own
transaction and marked pushed immediately, which makes a rerun resumable, and
inserts upsert on the primary key, which makes it idempotent.
"""

from __future__ import annotations

import argparse
import json
import logging
from dataclasses import dataclass, field

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import NullPool

from pagume_api.config import get_settings
from pagume_api.offline.router import LOCAL, PRIMARY, connect_args_for, get_router

logger = logging.getLogger(__name__)

# Replay scope. Everything else in the public schema is replayed; narrowing to
# transactional-only tables is a one-line change here.
EXCLUDED_TABLES: frozenset[str] = frozenset(
    {
        "sync_journal",
        "spatial_ref_sys",
        "geometry_columns",
        "geography_columns",
        "alembic_version",
    }
)


@dataclass
class SyncResult:
    pushed: int = 0
    skipped: int = 0
    failed: int = 0
    remaining: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.failed == 0


def _quote(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _engine(url: str, timeout: int) -> Engine:
    return create_engine(
        url,
        poolclass=NullPool,
        connect_args=connect_args_for(url, timeout),
    )


def _journal_exists(conn) -> bool:
    return bool(
        conn.execute(text("SELECT to_regclass('public.sync_journal') IS NOT NULL")).scalar()
    )


def pending_count() -> int:
    """Unpushed journal entries on the mirror, or 0 when there is no journal."""
    router = get_router()
    url = router.url_for(LOCAL)
    if not url:
        return 0
    try:
        engine = _engine(url, router.connect_timeout)
        try:
            with engine.connect() as conn:
                if not _journal_exists(conn):
                    return 0
                return int(
                    conn.execute(
                        text("SELECT count(*) FROM sync_journal WHERE pushed_at IS NULL")
                    ).scalar()
                    or 0
                )
        finally:
            engine.dispose()
    except Exception as exc:  # noqa: BLE001 — health reporting must not raise
        logger.debug("Could not read journal depth: %s", exc)
        return 0


def _primary_columns(conn, table: str) -> list[str]:
    rows = conn.execute(
        text(
            """
            SELECT a.attname
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relname = :table
              AND a.attnum > 0
              AND NOT a.attisdropped
            ORDER BY a.attnum
            """
        ),
        {"table": table},
    ).scalars()
    return list(rows)


def _apply(conn, table: str, op: str, pk: dict, row: dict | None, columns: list[str]) -> None:
    """Apply one journal entry to the primary.

    ``jsonb_populate_record`` does the type work: it feeds each JSON value
    through the target column's input function, so arrays, jsonb, timestamps,
    and PostGIS geometries all land correctly without per-type handling here.
    """
    qtable = f"public.{_quote(table)}"
    pk_cols = [c for c in pk if c in columns]

    if op == "DELETE":
        if not pk_cols:
            return
        where = " AND ".join(f"t.{_quote(c)} = k.{_quote(c)}" for c in pk_cols)
        conn.execute(
            text(
                f"DELETE FROM {qtable} t "
                f"USING jsonb_populate_record(NULL::{qtable}, CAST(:pk AS jsonb)) k "
                f"WHERE {where}"
            ),
            {"pk": json.dumps(pk)},
        )
        return

    source = f"SELECT * FROM jsonb_populate_record(NULL::{qtable}, CAST(:row AS jsonb))"
    if pk_cols:
        set_cols = [c for c in columns if c not in pk_cols]
        target = ", ".join(_quote(c) for c in pk_cols)
        action = (
            "DO UPDATE SET " + ", ".join(f"{_quote(c)} = EXCLUDED.{_quote(c)}" for c in set_cols)
            if set_cols
            else "DO NOTHING"
        )
        sql = f"INSERT INTO {qtable} {source} ON CONFLICT ({target}) {action}"
    else:
        sql = f"INSERT INTO {qtable} {source} ON CONFLICT DO NOTHING"

    conn.execute(text(sql), {"row": json.dumps(row or {})})


def push_pending(limit: int | None = None) -> SyncResult:
    """Replay unpushed journal entries from the mirror to the primary."""
    router = get_router()
    result = SyncResult()

    local_url = router.url_for(LOCAL)
    primary_url = router.url_for(PRIMARY)
    if not local_url or not primary_url:
        return result

    local = _engine(local_url, router.connect_timeout)
    primary = _engine(primary_url, router.connect_timeout)

    try:
        with local.connect() as lconn:
            if not _journal_exists(lconn):
                return result
            query = (
                "SELECT id, table_name, op, pk, row_data FROM sync_journal "
                "WHERE pushed_at IS NULL ORDER BY id"
            )
            if limit:
                query += f" LIMIT {int(limit)}"
            entries = lconn.execute(text(query)).mappings().all()

        if not entries:
            return result

        columns_cache: dict[str, list[str]] = {}

        for entry in entries:
            table = entry["table_name"]
            if table in EXCLUDED_TABLES:
                _mark(local, entry["id"], error="skipped: excluded table")
                result.skipped += 1
                continue

            if table not in columns_cache:
                with primary.connect() as probe:
                    columns_cache[table] = _primary_columns(probe, table)
            columns = columns_cache[table]
            if not columns:
                _mark(local, entry["id"], error="skipped: table missing on primary")
                result.skipped += 1
                continue

            pk = entry["pk"] or {}
            row = entry["row_data"]
            try:
                # One transaction per journal entry so a failure leaves later
                # rows unpushed and replay can resume cleanly.
                with primary.begin() as pconn:
                    _apply(pconn, table, entry["op"], pk, row, columns)
            except Exception as exc:  # noqa: BLE001
                message = f"journal #{entry['id']} {entry['op']} {table}: {exc}"
                logger.error("Write-back failed, stopping: %s", message)
                _mark(local, entry["id"], error=str(exc), pushed=False)
                result.failed += 1
                result.errors.append(message)
                break

            _mark(local, entry["id"])
            result.pushed += 1
    finally:
        local.dispose()
        primary.dispose()

    result.remaining = pending_count()
    return result


def _mark(local: Engine, entry_id: int, *, error: str | None = None, pushed: bool = True) -> None:
    """Record the outcome for one entry in its own transaction."""
    with local.begin() as conn:
        if pushed:
            conn.execute(
                text(
                    "UPDATE sync_journal SET pushed_at = now(), push_error = :err WHERE id = :id"
                ),
                {"id": entry_id, "err": error},
            )
        else:
            conn.execute(
                text("UPDATE sync_journal SET push_error = :err WHERE id = :id"),
                {"id": entry_id, "err": error},
            )


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="pagume-db-sync",
        description="Replay offline writes from the local mirror to the primary database.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Maximum entries to replay")
    parser.add_argument(
        "--status",
        action="store_true",
        help="Only report how many entries are waiting",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    settings = get_settings()
    if not settings.local_database_url:
        print("LOCAL_DATABASE_URL is not set — nothing to replay.")
        return 0

    if args.status:
        print(f"pending journal entries: {pending_count()}")
        return 0

    result = push_pending(limit=args.limit)
    print(
        f"pushed={result.pushed} skipped={result.skipped} "
        f"failed={result.failed} remaining={result.remaining}"
    )
    for error in result.errors:
        print(f"  error: {error}")
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
