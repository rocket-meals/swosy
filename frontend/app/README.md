## Configuration

### Web

Nothing to do?
TODO: Check if Name change is required?

### Native

#### AppName

In order to display the name correctly, we need to update the app name on both, iOS and Android

##### iOS

- Open File: `./app/ios/KitchenSinkappnativebase/Info.plist`
- Search for the key: `CFBundleDisplayName`
- Change its value

##### Android

- Open File: `./app/android/app/build.gradle`
    - Search for `applicationId`
    - Change its value to the bundle id: `de.rocketmeals.<YOUR IDENTIFIER>`
- Open File: `./app/android/app/src/main/res/values/strings.xml`
    - Enter New App name at: `<string name="app_name">NEW APP NAME</string>`

#### DeepLink Update

In order to support SSO Logins we need to update the DeepLink.
1. See current schemes for DeepLink:
    - ```npx uri-scheme list```
2. Remove all DeepLink schemes
    - ```npx uri-scheme remove <SCHEME WITHOUT ://>```
3. Add Correct DeepLink scheme
    - ```npx uri-scheme add de.rocketmeals.<YOUR IDENTIFIER>```
4. Update new scheme in ```app.config.js``` 
    - at ```export default ... "scheme": "de.rocketmeals.<YOUR IDENTIFIER>"```
5. Test the new DeepLink
    - Open in Emulator/Device in a browser: ```de.rocketmeals.<YOUR IDENTIFIER>://```
    - This should redirect to the app

#### PushNotification

For PushNotification we use ExpoNotification, since Firebase integration failes at archiving for iOS. Expo does a good job here, so we stick to it.
    
- Visit Expo: `https://expo.dev/accounts`
    - Create new Project (Create Account if needed)
        - Display Name only for Expo Relevant
        - Slug: de.rocketmeals.<YOUR IDENTIFIER>
    - Update in `app.config.js`
        -  `"experienceId": '@<OWNER>/<SLUG>',`

##### iOS

- Allow Notification for the App:
    - Open The XCode Workspace Project ```./app/ios/KitchenSinkappnativebase.xcworkspace```:
        - Go to `Signing & Capabilities` and add:
            - Background Modes:
            - Background fetch
            - Remote notifications
- Add Push Notification Certificate to Expo
    - Visit: `https://developer.apple.com/account/resources/authkeys/add`
    - Top Right See after the Team name the Team ID: 
        - Copy and Save it, we will need it in a moment
    - At: `https://developer.apple.com/account/resources/authkeys/add`
        - Select `Push Notifications`
        - Continue
        - "Key ID" Copy and Save it.
        - Download the Notification certificate
    - Upload the credentials to expo
        - Terminal ```expo credentials:manager -p ios```    
        - Add new Push Notifications Key
        - I want to upload my own file
        - Enter path to the .p8 file (drag and drop file into terminal)
        - Key ID fill in
        - Team ID fill in

##### Android

https://docs.expo.dev/push-notifications/push-notifications-setup/
- Visit Firebase Console
   - In the Firebase console, next to Project overview, click gear icon to open Project settings. (Android)
   - Click on the Cloud Messaging tab in the Settings pane.
   - Enable Legacy Messaging API
   - Copy the token listed next to the Server key.
   - Server Key is only available in Cloud Messaging API (Legacy), which is disabled by default.
Enable it by clicking the three-dot menu > Manage API in Google Cloud Console and following the steps in the console. Once the 
legacy messaging API is enabled, you should see Server Key in that section.
- Upload the credentials to expo
   - Terminal ```expo credentials:manager -p android```
   - What do you want to do? › Update FCM Api Key


## Development

To start developing you can edit and adapt the example project at: ```Frontend/src/project/```. There you will have the folders ```helper``` and ```screens```. 
All files in ```Kitchenhelper``` will be outsourced in the future in an own package.
More informtaion will be added in the future.

## Running it on Web / QuickStart

You can start the development by simply running:

```
npm run web
```

## Running it on Android

You can start the development by simply running:

```
npm run android
```

## Running it on iOS or Web

You will need a MacOS and XCode installed. Then you can start the development by simply running:

```
npm run ios
```


## Troubleshooting


- iOS Build
    - Try to remove @unimodules/core

- It looks like you're trying to use TypeScript but don't have the required
    - https://stackoverflow.com/questions/73182941/unable-to-use-typescript-with-expo-it-looks-like-youre-trying-to-use-typescr
    - Fix:
      - `npm install expo-cli`
      - `npm install --save-dev @types/react@^16.9.55`
