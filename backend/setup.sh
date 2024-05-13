#!/bin/bash
# Define where the backendEnv file is located
BACKEND_ENV_FILE=./../backendEnv
TEMPLATE_FILE=./envTemplate

# This script is used to set up the backend
# 1. Check if there exists a file already at BACKEND_ENV_FILE, if yes ask user if they want to overwrite it
echo "Checking if backendEnv exists"
if [ -f $BACKEND_ENV_FILE ]; then
    echo "backendEnv already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting"
        exit 1
    fi
fi

# 2. load and ask user if he wants to override the default values for: DOMAIN_PRE=, MYHOST=,
# load default values from envTemplate
echo "Loading default values from envTemplate"
source $TEMPLATE_FILE

echo "Setting up backendEnv"

# User can write their own values or use the default values read from the envTemplate file
read -p "Enter the domain prefix (default: $DOMAIN_PRE): " DOMAIN_PRE
read -p "Enter the host (default: $MYHOST): " MYHOST

# 3. Copy the envTemplate file to backendEnv
echo "Copying envTemplate to backendEnv"
cp $TEMPLATE_FILE $BACKEND_ENV_FILE

# 4. Replace the default values with the user input
echo "Replacing default values with user input"
sed -i "s/DOMAIN_PRE=.*/DOMAIN_PRE=$DOMAIN_PRE/" $BACKEND_ENV_FILE
sed -i "s/MYHOST=.*/MYHOST=$MYHOST/" $BACKEND_ENV_FILE