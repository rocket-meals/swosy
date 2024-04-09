#!/bin/bash
echo "Copy .env file"
cp .env .env.backup
# Check if docker-compose is running ask if the user wants to stop it if not we stop the script
if docker-compose ps &> /dev/null; then
  read -p "Docker-compose is running, do you want to stop it? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stop docker-compose"
    docker-compose down
  else
    echo "Please stop docker-compose before running this script"
    exit 1
  fi
fi
echo "Reset .env to git head"
git checkout HEAD -- .env
echo "Git pull"
git pull
echo "Go to backend"
cd Backend
echo "Update database"
npm run schema-apply:latest
echo "Go to root"
cd ..
echo "Copy .env file"
cp .env.backup .env
# Ask if the user wants to start docker-compose if not tell him to do it
read -p "Do you want to start docker-compose? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Start docker-compose"
  docker-compose up -d
else
  echo "Please start docker-compose"
fi