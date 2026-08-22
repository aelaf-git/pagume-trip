#!/usr/bin/env bash
# Refresh the local PostGIS mirror from Neon, then re-apply the offline
# journal triggers and the offline ID range.
#
# Runs inside postgis/postgis:18-3.6 so the client tools match the server:
#   docker compose --profile sync run --rm mirror
set -euo pipefail

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_DIR="${DUMP_DIR:-/dump}"
DUMP_FILE="$DUMP_DIR/neon.dump"

: "${NEON_DATABASE_URL:?NEON_DATABASE_URL is required}"
: "${LOCAL_DATABASE_URL:?LOCAL_DATABASE_URL is required}"

# SQLAlchemy URLs carry a driver suffix (postgresql+psycopg://) that libpq rejects.
to_libpq() {
  printf '%s' "$1" | sed -E 's#^postgresql\+[a-z0-9_]+://#postgresql://#; s#^postgres://#postgresql://#'
}

NEON_URL="$(to_libpq "$NEON_DATABASE_URL")"
LOCAL_URL="$(to_libpq "$LOCAL_DATABASE_URL")"

mkdir -p "$DUMP_DIR"

echo "==> Dumping Neon to $DUMP_FILE"
pg_dump -Fc --no-owner --no-acl "$NEON_URL" >"$DUMP_FILE"
echo "    $(du -h "$DUMP_FILE" | cut -f1) written"

echo "==> Restoring into the local mirror"
# pg_restore reports benign noise for extensions it cannot drop; --clean handles
# repeat runs, so a non-zero exit here is only fatal if the diff below fails.
pg_restore --clean --if-exists --no-owner --no-acl -d "$LOCAL_URL" "$DUMP_FILE" || true

echo "==> Applying offline journal and ID range"
for sql in "$OPS_DIR"/0*.sql; do
  echo "    $(basename "$sql")"
  psql -v ON_ERROR_STOP=1 -q -d "$LOCAL_URL" -f "$sql"
done

echo "==> Row-count diff (Neon vs mirror)"
count_query="
SELECT c.relname,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I', n.nspname, c.relname),
                           false, true, '')))[1]::text::bigint AS n
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT IN (
    'sync_journal',
    'spatial_ref_sys',
    'geometry_columns',
    'geography_columns'
  )
ORDER BY c.relname;
"

neon_counts="$(mktemp)"
local_counts="$(mktemp)"
trap 'rm -f "$neon_counts" "$local_counts"' EXIT

psql -At -F'|' -d "$NEON_URL" -c "$count_query" >"$neon_counts"
psql -At -F'|' -d "$LOCAL_URL" -c "$count_query" >"$local_counts"

mismatch=0
printf '%-34s %12s %12s\n' TABLE NEON MIRROR
while IFS='|' read -r table neon_n; do
  [ -n "$table" ] || continue
  local_n="$(awk -F'|' -v t="$table" '$1 == t { print $2 }' "$local_counts")"
  local_n="${local_n:-missing}"
  if [ "$neon_n" = "$local_n" ]; then
    printf '%-34s %12s %12s  ok\n' "$table" "$neon_n" "$local_n"
  else
    printf '%-34s %12s %12s  MISMATCH\n' "$table" "$neon_n" "$local_n"
    mismatch=1
  fi
done <"$neon_counts"

# Tables that exist only on the mirror are a schema drift signal too.
while IFS='|' read -r table local_n; do
  [ -n "$table" ] || continue
  if ! awk -F'|' -v t="$table" '$1 == t { found = 1 } END { exit !found }' "$neon_counts"; then
    printf '%-34s %12s %12s  EXTRA (mirror only)\n' "$table" "-" "$local_n"
    mismatch=1
  fi
done <"$local_counts"

if [ "$mismatch" -ne 0 ]; then
  echo "==> Mirror is NOT an exact duplicate of Neon (see MISMATCH rows above)"
  exit 1
fi

echo "==> Mirror matches Neon on every table"
