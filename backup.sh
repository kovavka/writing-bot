#!/bin/bash

# Set variables
DB_FILE="word-count.db"
BACKUP_DIR="./backups"
DATE=$(date +"%Y-%m-%d")

# Create the backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Define the backup file name
BACKUP_FILE="${BACKUP_DIR}/${DATE}_word-count.db"

# Copy the SQLite database file to the backup location
cp "$DB_FILE" "$BACKUP_FILE"

# Check if the backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
else
  echo "Backup failed!"
  exit 1
fi
