cd ../../backend &&
docker compose down &&
rm Backend/database/data.db &&
docker-compose up -d &&
cd ../backend-sync &&
node importSchema.js &&
cd scripts