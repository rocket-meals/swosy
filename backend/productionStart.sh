#!/bin/bash
# Set the permission of the database and other files
./permissionDatabase.sh
# Set the environment variables
source ./../backendEnv
# -p is to identify our services
docker-compose -p $MYHOST up -d --scale directus-master=$PRODUCTION_AMOUNT_WORKERS
