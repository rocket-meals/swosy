#!/bin/bash
echo "Setting read/write permission for uploads"
mkdir -p ./Backend/uploads/
chmod -R 777 ./Backend/uploads/
chmod -R 777 ./Backend/directusExtensions/

echo "Setting read/write permission for database"
mkdir -p ./Backend/database/
chmod -R 777 ./Backend/database/
touch ./Backend/database/data.db
chmod 777 ./Backend/database/data.db

echo "Setting read/write permission for secrets"
chmod -R 777 ./Backend/secrets/

echo "Finished"
