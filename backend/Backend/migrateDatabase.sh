#!/bin/bash
# npm ci
echo "Running npm ci to install dependencies"
npm ci
# npm run schema-apply:latest
echo "Running npm run schema-apply:latest to apply the latest schema"
npm run schema-apply:latest