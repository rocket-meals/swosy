#!/bin/bash
source .env
# -p is to identify our services
docker-compose -p $MYHOST down
