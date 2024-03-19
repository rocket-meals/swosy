#!/bin/bash
# check if the ./node_modules/ exists
if [ ! -d "./node_modules/" ]; then
  echo "Node modules not found, running npm install"
  npm install
fi
echo "Running npm run schema-apply:latest to apply the latest schema"
npm run schema-apply:latest