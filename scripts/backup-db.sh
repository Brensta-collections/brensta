#!/usr/bin/env bash
# backup-db.sh — nightly pg_dump of the BRENSTA Postgres database.
#
# Writes a gzip-compressed, timestamped dump into ./backups/ (gitignored by
# convention). Does NOT upload anywhere — pair this with an rsync /
# object-storage push cron on the host.
#
# Usage (manual):
#   bash scripts/backup-db.sh
#
# Usage (cron, daily at 02:17):
#   17 2 * * * cd /srv/brensta && bash scripts/backup-db.sh >>/var/log/brensta-backup.log 2>&1
#
# Requires:
#   - pg_dump 16 on PATH (apt: postgresql-client-16)
#   - DATABASE_URL exported in the shell (sourced from .env or systemd env)
#
# Safety:
#   - Read-only against the database (pg_dump).
#   - Writes to a dedicated backups/ directory; never overwrites.
#   - Dies loudly if DATABASE_URL is missing. Dies loudly if pg_dump fails
#     — the partial file is removed so cron does not shadow a real backup
#     with a truncated one.
set -Eeuo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "backup-db: DATABASE_URL is not set — refusing to proceed." >&2
  exit 2
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${BACKUP_DIR:-$HERE/backups}"
mkdir -p "$OUT_DIR"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
TMP="$OUT_DIR/.db-${TS}.sql.gz.partial"
FINAL="$OUT_DIR/db-${TS}.sql.gz"

cleanup() { [[ -f "$TMP" ]] && rm -f "$TMP"; }
trap cleanup EXIT

echo "backup-db: dumping to $FINAL"
# --no-owner / --no-acl keep the dump portable across hosts (useful for
# restoring into a dev / staging DB that has a different owning role).
pg_dump --no-owner --no-acl --format=plain --dbname="$DATABASE_URL" | gzip -9 > "$TMP"

mv "$TMP" "$FINAL"
SIZE="$(stat -c%s "$FINAL" 2>/dev/null || stat -f%z "$FINAL")"
echo "backup-db: wrote $FINAL (${SIZE} bytes)"

# Retention: keep the last 30 dumps, drop older ones. Non-fatal if fewer exist.
find "$OUT_DIR" -maxdepth 1 -name 'db-*.sql.gz' -type f -printf '%T@ %p\n' 2>/dev/null \
  | sort -nr | tail -n +31 | awk '{print $2}' | xargs -r rm -f || true
