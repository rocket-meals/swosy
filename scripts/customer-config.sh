#!/bin/bash
# scripts/customer-config.sh
# Belegt CUSTOMER anhand des Repository-Namens (GITHUB_REPOSITORY = "owner/repo")

case "$GITHUB_REPOSITORY" in
  rocket-meals/swosy)
    echo "CUSTOMER=swosy"
    ;;
  rocket-meals/studi-futter)
    echo "CUSTOMER=studi-futter"
    ;;
  *)
    echo "CUSTOMER=test"
    ;;
esac
