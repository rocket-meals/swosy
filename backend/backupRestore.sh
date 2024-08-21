#!/bin/bash

# Check if the backup file name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file_name.sql.gz or backup_file_name.sql>"
  exit 1
fi

# Set the backup file name from the first argument
BACKUP_FILE=$1

# Build the Docker image for the restore service before running it
docker-compose build rocket-meals-database-restore

# Start the restore process using docker-compose with the specified profile
BACKUP_FILE=${BACKUP_FILE} docker-compose --profile restore up rocket-meals-database-restore

# Optional: Stop the restore service after completion
docker-compose stop rocket-meals-database-restore

# Optional: Remove the restore service container
docker-compose rm -f rocket-meals-database-restore
