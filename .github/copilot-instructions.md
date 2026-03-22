# Copilot Instructions

## Frontend: React screens and components

- **No separate `styles.ts` files.** All styles, logic, and exports for a screen or component must stay in a single file (e.g. `index.tsx`). Use `StyleSheet.create(...)` inline inside the same file.
- **English names only** for screen folders, component files, and route paths. Do not use German words in file or folder names.

## String replacement

- **Never use `String.prototype.replaceAll()` or `String.prototype.replace()` for simple substitutions.** Use `StringHelper` from `repo-depkit-common` instead:
  - For literal (non-regex) replacements: `StringHelper.replaceAllLiteralWithOptions({ str, find, replace })`
  - For regex-based replacements: `StringHelper.replaceAllWithOptions({ str, find, replace, flags? })`
- **Exception**: `.replace()` with a regex callback function (e.g. `text.replace(/pattern/g, word => ...)`) is acceptable when the replacement logic cannot be expressed as a simple string substitution.
