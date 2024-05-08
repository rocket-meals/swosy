cd ../../backend &&
docker compose up -d &&
cd ../backend-sync &&
node importSchema.js pull &&
cd scripts