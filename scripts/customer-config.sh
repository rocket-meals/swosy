#!/bin/bash
# scripts/customer-config.sh
# Belegt CUSTOMER anhand des Repository-Namens (GITHUB_REPOSITORY = "owner/repo")

case "$GITHUB_REPOSITORY" in
  rocket-meals/swosy)
    echo "CUSTOMER=swosy"
    echo "EXPO_PUBLIC_CUSTOMER=swosy"
    ;;
  rocket-meals/studi-futter)
    echo "CUSTOMER=studi-futter"
    echo "EXPO_PUBLIC_CUSTOMER=studi-futter"
    ;;
  *)
    echo "CUSTOMER=test"
    echo "EXPO_PUBLIC_CUSTOMER=test"
    ;;
esac
