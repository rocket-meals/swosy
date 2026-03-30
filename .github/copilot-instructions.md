# Copilot Instructions

## Frontend: React screens and components

- **No separate `styles.ts` files.** All styles, logic, and exports for a screen or component must stay in a single file (e.g. `index.tsx`). Use `StyleSheet.create(...)` inline inside the same file.
- **English names only** for screen folders, component files, and route paths. Do not use German words in file or folder names.
- **Prefer common-ui components.** When displaying data, always prefer reusing components from `repo-depkit-common-ui` (e.g. `SettingsList`, `SettingsListGroupTitle`, `SettingsListProgress`, `SettingsListBoolean`, etc.) over building custom implementations from scratch.

## Expo Plugins: Build number increment

- **Whenever an Expo plugin is added or updated in any frontend project** (i.e. any change inside the `plugins` array in an `app.config.ts`), the `config.ts` file of that project **must** have its build number incremented.
- Expo plugins contain native code. A changed native layer requires a new binary build, so the build number stored in `getBuildNumber()` in `config.ts` must be bumped by at least 1.
- Example: if `getBuildNumber()` currently returns `7`, change it to `8`.

## String replacement

- **Never use `String.prototype.replaceAll()` or `String.prototype.replace()` for simple substitutions.** Use `StringHelper` from `repo-depkit-common` instead:
  - For literal (non-regex) replacements: `StringHelper.replaceAllLiteralWithOptions({ str, find, replace })`
  - For regex-based replacements: `StringHelper.replaceAllWithOptions({ str, find, replace, flags? })`
- **Exception**: `.replace()` with a regex callback function (e.g. `text.replace(/pattern/g, word => ...)`) is acceptable when the replacement logic cannot be expressed as a simple string substitution.
