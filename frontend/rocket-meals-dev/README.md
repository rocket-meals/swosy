# rocket-meals

## Synchronized variables and Storage

In order to synchronize states of variables across the app, we use the `easy-peasy` library. It is a wrapper around `redux` and `redux-thunk` libraries.

In order to use it, follow these steps:

1. Create a variable entry:
    - a) Store on device: `app/helper/sync_state_helper/PersistentStore.ts` and add a new static variable to the `PersistentStore` class.
    - b) Just synchronize across the app: `app/helper/sync_state_helper/NonPersistentStore.ts` and add a new static variable to the `NonPersistentStore` class.

2. Use it in the app:
   ```javascript
   import {useSyncState} from "@/helper/sync_state_helper/SyncState";
   import {NonPersistentStore} from "@/helper/sync_state_helper/NonPersistentStore";

   const [exampleValue, setExampleValue] = useSyncState<string>(NonPersistentStore.test);
    ```