cd ../../backend &&
docker compose up -d &&
cd ../backend-sync &&
node importSchema.js push &&
cd scripts