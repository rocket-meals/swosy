# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 9 | 9 |
| 🐛 Reliability | 5 | 5 |
| 🔧 Maintainability | 50 | 36 |

**Total issues:** 64 (showing top 50 prioritized by: Security > Reliability > Maintainability)

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

## 🐛 Reliability (5/5)

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

## 🔧 Maintainability (36/50)

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
  apps/score-tracker/frontend/app/games/[id].tsx:39
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L39

- **Remove this unused import of 'setGameTypeIcon'.**
  apps/score-tracker/frontend/app/games/[id].tsx:21
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L21

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/app/games/[id].tsx:88
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L88

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/app/index.tsx:429
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L429

- **Remove this unused import of 'resetAll'.**
  apps/score-tracker/frontend/app/index.tsx:49
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L49

- **Remove this useless assignment to variable "friends".**
  apps/score-tracker/frontend/app/index.tsx:1337
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L1337

- **Remove this useless assignment to variable "toggleEditingPlayers".**
  apps/score-tracker/frontend/app/index.tsx:1356
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L1356

- **Remove this useless assignment to variable "categoryValues".**
  apps/score-tracker/frontend/app/index.tsx:1341
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L1341

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

- **Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.**
  apps/score-tracker/frontend/helpers/BuiltinTimesMigration.ts:115
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/BuiltinTimesMigration.ts#L115

- **The empty object is useless.**
  apps/score-tracker/frontend/helpers/BuiltinTimesMigration.ts:168
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/BuiltinTimesMigration.ts#L168

- **Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.**
  apps/score-tracker/frontend/helpers/GameCategories.ts:590
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/GameCategories.ts#L590

- **The empty object is useless.**
  apps/score-tracker/frontend/helpers/GameCategories.ts:225
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/GameCategories.ts#L225

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/score-tracker/frontend/helpers/GameRules.ts:486
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/GameRules.ts#L486

- **The empty object is useless.**
  apps/score-tracker/frontend/store/gameSlice.ts:318
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/gameSlice.ts#L318

- **Remove this unused import of 'GameStatus'.**
  apps/score-tracker/frontend/store/gameSlice.ts:3
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/gameSlice.ts#L3

- **Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read.**
  apps/score-tracker/frontend/store/gameTypesSlice.ts:281
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/gameTypesSlice.ts#L281

- **'../helpers/GameHistoryStorage' imported multiple times.**
  apps/score-tracker/frontend/store/store.ts:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/store.ts#L11

- **'../helpers/GameHistoryStorage' imported multiple times.**
  apps/score-tracker/frontend/store/store.ts:14
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/store.ts#L14

- **Use the "RegExp.exec()" method instead.**
  apps/scripts/check-build-version.ts:10
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/check-build-version.ts#L10

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/scripts/check-build-version.ts:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/check-build-version.ts#L11

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/scripts/check-build-version.ts:23
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/check-build-version.ts#L23

