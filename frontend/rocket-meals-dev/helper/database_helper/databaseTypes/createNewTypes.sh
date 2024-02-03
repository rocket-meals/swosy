#!/bin/bash
# open types.ts and replace all "string & " with "string | "
sed -i -e 's/string \& /string | /g' types.ts
sed -i -e 's/number \& /number | /g' types.ts
