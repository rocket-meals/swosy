#!/bin/bash
echo "Setting read/write permission for database"
chmod -R 777 ./Backend/database/
chmod -R 777 ./Backend/uploads/
touch ./Backend/database/data.db
chmod 777 ./Backend/database/data.db
echo "Finished"
