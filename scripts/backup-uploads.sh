#!/usr/bin/env bash
# backup-uploads.sh — tar + gzip the local upload directory for off-host sync.
#
# Only needed while UPLOAD_DRIVER=local. Once uploads land in S3/R2, the
# object store itself is the backup; retire this script then.
#
# Usage (manual):
#   bash scripts/backup-uploads.sh
#
# Usage (cron, daily at 02:37):
#   37 2 * * * cd /srv/brensta && bash scripts/backup-uploads.sh >>/var/log/brensta-backup.log 2>&1
#
# Safety:
#   - Read-only against public/uploads (tar).
#   - Writes to a dedicated backups/ directory; never overwrites.
#   - If public/uploads is missing or empty, exits with status 0 and prints
#     a diagnostic — a cron run that finds nothing to back up is not an
#     error, so it should not page anyone.
set -Eeuo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$HERE/public/uploads"
OUT_DIR="${BACKUP_DIR:-$HERE/backups}"
mkdir -p "$OUT_DIR"

if [[ ! -d "$SRC" ]]; then
  echo "backup-uploads: $SRC does not exist — nothing to back up."
  exit 0
fi
if [[ -z "$(ls -A "$SRC" 2>/dev/null | grep -v '^\.gitkeep$' || true)" ]]; then
  echo "backup-uploads: $SRC is empty (only .gitkeep) — nothing to back up."
  exit 0
fi

TS="$(date -u +%Y%m%dT%H%M%SZ)"
TMP="$OUT_DIR/.uploads-${TS}.tar.gz.partial"
FINAL="$OUT_DIR/uploads-${TS}.tar.gz"

cleanup() { [[ -f "$TMP" ]] && rm -f "$TMP"; }
trap cleanup EXIT

echo "backup-uploads: archiving $SRC → $FINAL"
tar --create --gzip --file="$TMP" --directory="$HERE" public/uploads

mv "$TMP" "$FINAL"
SIZE="$(stat -c%s "$FINAL" 2>/dev/null || stat -f%z "$FINAL")"
echo "backup-uploads: wrote $FINAL (${SIZE} bytes)"

# Retention: keep the last 14 archives, drop older ones.
find "$OUT_DIR" -maxdepth 1 -name 'uploads-*.tar.gz' -type f -printf '%T@ %p\n' 2>/dev/null \
  | sort -nr | tail -n +15 | awk '{print $2}' | xargs -r rm -f || true
