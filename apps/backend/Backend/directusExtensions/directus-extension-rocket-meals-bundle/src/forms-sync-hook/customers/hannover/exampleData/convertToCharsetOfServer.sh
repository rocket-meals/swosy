#!/bin/bash

INPUT_FILE="whv_auszuege.csv"
OUTPUT_FILE="whv_auszuege_server.csv"

# Check if input file exists
if [[ ! -f "$INPUT_FILE" ]]; then
  echo "❌ Eingabedatei '$INPUT_FILE' nicht gefunden."
  exit 1
fi

# Convert UTF-8 to ISO-8859-1 with transliteration
# Use portable syntax: no '-o', redirect output instead
echo "🔄 Konvertiere '$INPUT_FILE' nach ISO-8859-1 ..."
iconv -f UTF-8 -t ISO-8859-1//TRANSLIT "$INPUT_FILE" > "$OUTPUT_FILE"

# Check success
if [[ $? -eq 0 ]]; then
  echo "✅ Konvertierung abgeschlossen: '$OUTPUT_FILE'"
else
  echo "❌ Fehler bei der Konvertierung."
  exit 2
fi
