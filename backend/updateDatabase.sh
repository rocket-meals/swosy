#!/bin/bash
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


# Before we do anything we need to check if the user has any changes in the .env file
# check if .env.backup exists, tell the user we will use the .env.backup file to restore the .env file
if [ -f .env.backup ]; then
  echo "Found .env.backup, will use this file to restore .env"
else
  echo "No .env.backup found, would you like to create one? (y/n)"
  read -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Create .env.backup"
    cp .env .env.backup
  else
    echo "Please create a .env.backup file before running this script"
    exit 1
fi
echo "Reset .env to git head"
git checkout HEAD -- .env
echo "Git pull"
git pull
echo "Restore .env"
cp .env.backup .env


echo "Go to backend"
cd Backend
echo "Update database"
npm run schema-apply:latest
echo "Go to root"
cd ..
# Ask if the user wants to start docker-compose if not tell him to do it
read -p "Do you want to start docker-compose? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Start docker-compose"
  docker-compose up -d
else
  echo "Please start docker-compose"
fi