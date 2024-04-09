#!/bin/bash
echo "Copy .env file"
cp .env .env.backup
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
