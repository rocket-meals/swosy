# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 9 | 9 |
| 🐛 Reliability | 11 | 11 |
| 🔧 Maintainability | 69 | 30 |

**Total issues:** 89 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (9/9)

- **Lifecycle scripts are enabled by default in Yarn v2+.**
  .github/workflows/backend-schema-sync-pull.yml:55
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/backend-schema-sync-pull.yml#L55

- **Lifecycle scripts are enabled by default in Yarn v2+.**
  .github/workflows/backend-schema-sync-pull.yml:52
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/backend-schema-sync-pull.yml#L52

- **Make sure that no untrusted code is executed from a fork.**
  .github/workflows/ios-submit-review-geonexia.yml:39
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-geonexia.yml#L39

- **Make sure that no untrusted code is executed from a fork.**
  .github/workflows/ios-submit-review-rocket-meals.yml:35
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-rocket-meals.yml#L35

- **Make sure that no untrusted code is executed from a fork.**
  .github/workflows/ios-submit-review-score-tracker.yml:39
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-score-tracker.yml#L39

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/scripts/store-metadata-extract.ts:82
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/store-metadata-extract.ts#L82

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/scripts/store-metadata-extract.ts:82
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/store-metadata-extract.ts#L82

- **Change this code to prevent confidential data from leaking in logs.**
  apps/scripts/store-metadata-extract.ts:83
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/store-metadata-extract.ts#L83

- **Change this code to not log user-controlled data.**
  apps/scripts/submit-ios-review.ts:372
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/submit-ios-review.ts#L372

## 🐛 Reliability (11/11)

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/score-tracker/frontend/helpers/ImageSearch.ts:168
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/ImageSearch.ts#L168

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/scripts/check-build-version.ts:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/check-build-version.ts#L11

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/scripts/check-build-version.ts:23
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/check-build-version.ts#L23

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/scripts/store-metadata-diff.ts:48
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/store-metadata-diff.ts#L48

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/scripts/store-metadata-extract.ts:53
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/store-metadata-extract.ts#L53

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  packages/common/src/CompressionHelper.ts:54
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/CompressionHelper.ts#L54

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  packages/common/src/CompressionHelper.ts:74
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/CompressionHelper.ts#L74

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/CompressionHelper.ts:153
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/CompressionHelper.ts#L153

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  packages/common/src/CompressionHelper.ts:189
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/CompressionHelper.ts#L189

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  packages/common/src/CompressionHelper.ts:196
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/CompressionHelper.ts#L196

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  packages/common/src/CompressionHelper.ts:236
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/CompressionHelper.ts#L236

## 🔧 Maintainability (30/69)

- **Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:1248
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L1248

- **Async method 'resolveFoodofferToCreateOrLog' has too many parameters (8). Maximum allowed is 7.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:1324
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L1324

- **Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/TranslationHelper.ts:353
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/TranslationHelper.ts#L353

- **Extract this nested ternary operation into an independent statement.**
  apps/frontend/app/components/Login/LoginDebugPanel.tsx:63
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/Login/LoginDebugPanel.tsx#L63

- **Do not use Array index in keys**
  apps/frontend/app/components/Login/LoginDebugPanel.tsx:74
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/Login/LoginDebugPanel.tsx#L74

- **Refactor this code to not use nested template literals.**
  apps/frontend/app/helper/authHelper.ts:267
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/authHelper.ts#L267

- **The empty object is useless.**
  apps/frontend/app/redux/actions/FoodOffers/FoodOffers.ts:200
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/redux/actions/FoodOffers/FoodOffers.ts#L200

- **Remove this unused import of 'GameType'.**
  apps/score-tracker/frontend/app/games/[id].tsx:38
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L38

- **Remove this unused import of 'setGameTypeIcon'.**
  apps/score-tracker/frontend/app/games/[id].tsx:21
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L21

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/app/games/[id].tsx:89
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L89

- **Remove this unused import of 'SettingsListTextInput'.**
  apps/score-tracker/frontend/app/games/index.tsx:9
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/index.tsx#L9

- **Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.**
  apps/score-tracker/frontend/app/index.tsx:110
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L110

- **Extract this nested ternary operation into an independent statement.**
  apps/score-tracker/frontend/app/index.tsx:197
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L197

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/app/index.tsx:197
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L197

- **Remove this unused import of 'resetAll'.**
  apps/score-tracker/frontend/app/match/index.tsx:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/match/index.tsx#L50

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/app/match/index.tsx:431
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/match/index.tsx#L431

- **Remove this useless assignment to variable "friends".**
  apps/score-tracker/frontend/app/match/index.tsx:1362
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/match/index.tsx#L1362

- **Remove this useless assignment to variable "categoryValues".**
  apps/score-tracker/frontend/app/match/index.tsx:1366
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/match/index.tsx#L1366

- **Remove this useless assignment to variable "toggleEditingPlayers".**
  apps/score-tracker/frontend/app/match/index.tsx:1381
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/match/index.tsx#L1381

- **Replace this union type with a type alias.**
  apps/score-tracker/frontend/components/CategoryValueRows.tsx:57
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/CategoryValueRows.tsx#L57

- **Refactor this function to reduce its Cognitive Complexity from 25 to the 15 allowed.**
  apps/score-tracker/frontend/components/CategoryValueRows.tsx:282
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/CategoryValueRows.tsx#L282

- **Extract this nested ternary operation into an independent statement.**
  apps/score-tracker/frontend/components/GameCategorySettings.tsx:335
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameCategorySettings.tsx#L335

- **'../helpers/GameImageUpload' imported multiple times.**
  apps/score-tracker/frontend/components/GameImagePicker.tsx:21
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameImagePicker.tsx#L21

- **'../helpers/GameImageUpload' imported multiple times.**
  apps/score-tracker/frontend/components/GameImagePicker.tsx:23
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameImagePicker.tsx#L23

- **Use `export…from` to re-export `defaultImageQuery`.**
  apps/score-tracker/frontend/components/GameImagePicker.tsx:338
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameImagePicker.tsx#L338

- **Mark the props of the component as read-only.**
  apps/score-tracker/frontend/components/OnboardingScreen.tsx:96
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/OnboardingScreen.tsx#L96

- **Mark the props of the component as read-only.**
  apps/score-tracker/frontend/components/OnboardingScreen.tsx:139
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/OnboardingScreen.tsx#L139

- **Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.**
  apps/score-tracker/frontend/components/ShareImportContent.tsx:122
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/ShareImportContent.tsx#L122

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/components/ShareImportContent.tsx:186
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/ShareImportContent.tsx#L186

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/components/ShareImportContent.tsx:186
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/ShareImportContent.tsx#L186

