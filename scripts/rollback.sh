#!/bin/bash
# Yayasan Sahabat Khairat Indonesia - Rollback Script

set -e

BACKUP_DIR="/opt/clicky-foundation/backups"

echo "=== Yayasan Sahabat Khairat Indonesia Rollback ==="
echo "Available backups:"
ls -lt "$BACKUP_DIR"/*.gz 2>/dev/null | head -20

echo ""
echo "Enter backup file to restore (without path):"
read BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "Error: Backup file not found!"
    exit 1
fi

echo "WARNING: This will restore the database from backup."
echo "Current data may be lost. Are you sure? (yes/no)"
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

echo "Stopping services..."
cd /opt/clicky-foundation
docker compose stop fastapi

echo "Restoring database..."
docker compose exec -T postgres psql -U clicky clicky_db < <(zcat "$BACKUP_DIR/$BACKUP_FILE")

echo "Starting services..."
docker compose start fastapi

echo "Rollback completed!"
