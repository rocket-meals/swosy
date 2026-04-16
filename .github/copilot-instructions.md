# Copilot Instructions

## Frontend: React screens and components

- **No separate `styles.ts` files.** All styles, logic, and exports for a screen or component must stay in a single file (e.g. `index.tsx`). Use `StyleSheet.create(...)` inline inside the same file.
- **English names only** for screen folders, component files, and route paths. Do not use German words in file or folder names.
- **Prefer common-ui components.** When displaying data, always prefer reusing components from `repo-depkit-common-ui` (e.g. `SettingsList`, `SettingsListGroupTitle`, `SettingsListProgress`, `SettingsListBoolean`, etc.) over building custom implementations from scratch.

## Expo Plugins: Build number increment

- **Whenever an Expo plugin is added or updated in any frontend project** (i.e. any change inside the `plugins` array in an `app.config.ts`), the `config.ts` file of that project **must** have its build number incremented.
- Expo plugins contain native code. A changed native layer requires a new binary build, so the build number stored in `getBuildNumber()` in `config.ts` must be bumped by at least 1.
- Example: if `getBuildNumber()` currently returns `7`, change it to `8`.

## New Expo apps: Required build number setup

- **Every new Expo app** (e.g. a new folder under `apps/`) **must** have a `config.ts` file with a `getBuildNumber()` function that returns an integer (start at `1`).
- The `app.config.ts` must import `getBuildNumber` from `./config.ts` and use the result for `ios.buildNumber`, `android.versionCode`, and `version`.
- The CI workflow (`.github/workflows/ci.yml`) **must** be extended with three new jobs for the new app, following the pattern of existing apps (e.g. `score-tracker-check-build`, `score-tracker-build-ios`, `score-tracker-expo-update`):
  1. A `<app>-check-build` job using `./.github/actions/check-build-number` with the app's `working-directory`.
  2. A `<app>-build-ios` job (and optionally `<app>-build-android`) that only runs when the build number changed.
  3. A `<app>-expo-update` job for OTA updates.
- **Whenever any native change is made to an existing app** (not just plugin changes), increment `getBuildNumber()` in that app's `config.ts` by at least 1 to trigger a new native build in CI.

## New Expo apps: EAS config generation

- **Every new Expo app must have a `generate-eas-config.ts` script** set up under `apps/<app>/scripts/generate-eas-config.ts`, following the pattern of existing apps (e.g. `apps/score-tracker/scripts/generate-eas-config.ts`).
- The script reads `apps/<app>/frontend/eas.template.json` (which contains static submit config such as `appleId` and `appleTeamId`) and writes the final `apps/<app>/frontend/eas.json`, optionally injecting `ascAppId` from `getCustomerConfig().appleAppId`.
- **After creating or updating the template**, run the script to (re-)generate `eas.json`:
  ```
  yarn workspace <app-workspace-name> generate:eas
  ```
- Add a `"generate:eas"` entry to the app's `package.json` scripts pointing to the script:
  ```json
  "generate:eas": "ts-node --project ../scripts/tsconfig.json ../scripts/generate-eas-config.ts"
  ```
- **Never edit `eas.json` manually** — always update `eas.template.json` and re-run the script.

## Geonexia: Dialogs and alerts

- **Never use React Native's `Alert` in Geonexia.** Use `useMyScrollviewModal` instead for all user-facing dialogs, confirmations, and notifications.

## String replacement

- **Never use `String.prototype.replaceAll()` or `String.prototype.replace()` for simple substitutions.** Use `StringHelper` from `repo-depkit-common` instead:
  - For literal (non-regex) replacements: `StringHelper.replaceAllLiteralWithOptions({ str, find, replace })`
  - For regex-based replacements: `StringHelper.replaceAllWithOptions({ str, find, replace, flags? })`
- **Exception**: `.replace()` with a regex callback function (e.g. `text.replace(/pattern/g, word => ...)`) is acceptable when the replacement logic cannot be expressed as a simple string substitution.
