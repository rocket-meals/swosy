# Flows

## TODO:

- Need a nice import and export feature for flows in the future. Currently we will list all flows needed to be created here
- Make "parsing_status" use everywhere same values not like for "Utilization"

## Foods flows

- Sidebar --> Settings --> Flows
- Create a new directus flow
- Trigger Setup --> ```Configure as Schedule (CRON)```
  - every 5 minutes: ```*/5 * * * *```
- Create a operation --> ```Update Data```
- Collection: ```App Settings Foods```
- Permission: ```Full Access```
- Emit Events: ```true```  // in order to trigger the hooks
- Payload : ```{ "parsing_status": "check"}```
- Query : ```{ "filter": { "_and": [] } }```

## Cashregister flows

- Sidebar --> Settings --> Flows
- Create a new directus flow
- Trigger Setup --> ```Configure as Schedule (CRON)```
  - every 5 minutes: ```*/5 * * * *```
- Create a operation --> ```Update Data```
- Collection: ```App Settings Cashregsiters```
- Permission: ```Full Access```
- Emit Events: ```true```  // in order to trigger the hooks
- Payload : ```{ "parsing_status": "check"}```
- Query : ```{ "filter": { "_and": [] } }```

## Utilization flows

- Sidebar --> Settings --> Flows
- Create a new directus flow
- Trigger Setup --> ```Configure as Schedule (CRON)```
  - every 5 minutes: ```*/5 * * * *```
- Create a operation --> ```Update Data```
- Collection: ```App Settings Utilizations```
- Permission: ```Full Access```
- Emit Events: ```true```  // in order to trigger the hooks
- Payload : ```{ "parsing_status": "check"}```
- Query : ```{ "filter": { "_and": [] } }```
