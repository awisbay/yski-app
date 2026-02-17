#!/bin/bash
# Clicky Foundation - Database Backup Script
# Run this script daily via cron: 0 2 * * * /opt/clicky-foundation/scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="/opt/clicky-foundation/backups"
DB_NAME="clicky_db"
DB_USER="clicky"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/clicky_db_${DATE}.sql"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup: $BACKUP_FILE"
docker compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "${BACKUP_FILE}.gz"

# Encrypt backup (optional - requires GPG key)
# gpg --encrypt --recipient backup@clickyfoundation.id "${BACKUP_FILE}.gz"

# Verify backup
if [ -f "${BACKUP_FILE}.gz" ]; then
    echo "Backup created successfully: ${BACKUP_FILE}.gz"
    ls -lh "${BACKUP_FILE}.gz"
else
    echo "Backup failed!"
    exit 1
fi

# Upload to S3 (optional - configure AWS credentials)
# aws s3 cp "${BACKUP_FILE}.gz" s3://clicky-backups/database/

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "clicky_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log cleanup
echo "Backup cleanup completed. Remaining backups:"
ls -lh "$BACKUP_DIR"

echo "Backup process completed successfully!"
