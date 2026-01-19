#!/bin/bash

# ============================================================================
# Hisham Traders ERP - MySQL Backup Script
# ============================================================================
# Description: Automated MySQL database backup with compression and retention
# Schedule: Daily at 2:00 AM via cron
# Retention: Configurable (default: 7 days)
# ============================================================================

set -e

# ============================================================================
# Configuration
# ============================================================================
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/hisham_erp_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# ============================================================================
# Backup Start
# ============================================================================
echo "=========================================="
echo "Starting MySQL Backup: $(date)"
echo "=========================================="
echo "Database: ${MYSQL_DATABASE}"
echo "Host: ${MYSQL_HOST}"
echo "Retention: ${RETENTION_DAYS} days"
echo "=========================================="

# ============================================================================
# Create Backup Directory
# ============================================================================
mkdir -p ${BACKUP_DIR}

# ============================================================================
# Perform MySQL Backup
# ============================================================================
echo "Backing up database: ${MYSQL_DATABASE}"

mysqldump -h ${MYSQL_HOST} \
  -u ${MYSQL_USER} \
  -p${MYSQL_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --add-drop-database \
  --databases ${MYSQL_DATABASE} > ${BACKUP_FILE}

# Check if backup was successful
if [ $? -ne 0 ]; then
    echo "✗ MySQL backup failed!"
    exit 1
fi

echo "✓ MySQL dump completed successfully"

# ============================================================================
# Compress Backup
# ============================================================================
echo "Compressing backup..."
gzip ${BACKUP_FILE}
BACKUP_FILE="${BACKUP_FILE}.gz"

# ============================================================================
# Verify Backup
# ============================================================================
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✓ Backup completed successfully"
    echo "  File: ${BACKUP_FILE}"
    echo "  Size: ${BACKUP_SIZE}"
else
    echo "✗ Backup file not found after compression!"
    exit 1
fi

# ============================================================================
# Clean Up Old Backups (Retention Policy)
# ============================================================================
echo ""
echo "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
DELETED_COUNT=$(find ${BACKUP_DIR} -name "hisham_erp_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} | wc -l)

if [ ${DELETED_COUNT} -gt 0 ]; then
    find ${BACKUP_DIR} -name "hisham_erp_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
    echo "✓ Deleted ${DELETED_COUNT} old backup(s)"
else
    echo "✓ No old backups to delete"
fi

# ============================================================================
# List Current Backups
# ============================================================================
echo ""
echo "Current backups:"
ls -lh ${BACKUP_DIR}/hisham_erp_backup_*.sql.gz 2>/dev/null || echo "  No backups found"

# ============================================================================
# Backup Summary
# ============================================================================
echo ""
echo "=========================================="
echo "Backup completed successfully: $(date)"
echo "=========================================="

exit 0
