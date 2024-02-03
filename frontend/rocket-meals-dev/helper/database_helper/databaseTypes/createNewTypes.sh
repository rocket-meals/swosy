#!/bin/bash
# open types.ts and replace all "string & " with "string | "
sed -e 's/string \& /string | /g' types.ts
sed -e 's/string & /string | /g' typesv2.ts
sed -e 's/number \& /number | /g' types.ts
sed -e 's/number \& /number | /g' types.ts