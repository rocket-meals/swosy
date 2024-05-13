#!/bin/bash
source ./../backendEnv
# -p is to identify our services
docker-compose -p $MYHOST down
