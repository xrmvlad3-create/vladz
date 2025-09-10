#!/bin/sh
# Simple PostgreSQL backup script for dockerized environment

set -e

BACKUP_DIR=${BACKUP_DIR:-/backups}
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_DATABASE:-izamanagement}
DB_USER=${DB_USERNAME:-izauser}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Starting backup of database '$DB_NAME' to $FILENAME"

mkdir -p "$BACKUP_DIR"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$FILENAME"

echo "Backup completed: $FILENAME"