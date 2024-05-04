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
   
## Update Expo SDK

In order to update the Expo SDK, follow these steps:

1. Run `npm install expo@latest` - which will update the `package.json` file with the new version of the SDK.
2. Run `npx expo install --fix` to upgrade the project to the new version of the SDK and fix any issues that may arise.

## iOS Build

In order to build the iOS app, follow these steps with expo:
1. Run `eas build --platform ios` to build the iOS app.
2. Run `eas submit --platform ios` to submit the build to the App Store.
3. Run `eas update --branch <BRANCH>` where `<BRANCH>` is the branch you want to update the app to. For production, use `production` and for development, use `main`.

