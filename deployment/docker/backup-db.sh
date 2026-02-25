#!/bin/sh
# ────────────────────────────────────────────────────────────
# PostgreSQL automated backup script for AncerLarins.
#
# Runs via cron inside the backup container (see docker-compose.yml).
# - Creates a compressed pg_dump every run
# - Retains the last N backups (default 7)
# - Logs to stdout for Docker log collection
# ────────────────────────────────────────────────────────────

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_DATABASE:-ancerlarins}"
DB_USER="${DB_USERNAME:-ancerlarins}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="ancerlarins_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date -Iseconds)] Starting backup: ${FILENAME}"

# Wait for postgres to be ready
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
  echo "[$(date -Iseconds)] Waiting for PostgreSQL..."
  sleep 5
done

# Run the dump
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "$FILEPATH"

SIZE=$(du -h "$FILEPATH" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: ${FILENAME} (${SIZE})"

# Prune old backups
DELETED=0
find "$BACKUP_DIR" -name "ancerlarins_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" | while read -r old; do
  echo "[$(date -Iseconds)] Pruning old backup: $(basename "$old")"
  rm -f "$old"
  DELETED=$((DELETED + 1))
done

REMAINING=$(find "$BACKUP_DIR" -name "ancerlarins_*.sql.gz" -type f | wc -l)
echo "[$(date -Iseconds)] Retention: keeping ${REMAINING} backups (max age: ${RETENTION_DAYS} days)"
