#!/bin/bash
rm -rf ./schemes/latest.txt
latest_file=$(ls ./schemes | awk -F'-' '{ print $1"-"$2"-"$3"-"$4"-scheme.yaml" }' | sort -r | head -n1)
echo "Latest schema found: ${latest_file}"
echo "${latest_file}" > ./schemes/latest.txt

