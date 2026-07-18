# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 8 | 8 |
| 🐛 Reliability | 54 | 42 |
| 🔧 Maintainability | 1950 | 0 |

**Total issues:** 2012 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (8/8)

- **Lifecycle scripts are enabled by default in Yarn v2+.**
  .github/workflows/ios-submit-review-geonexia.yml:30
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-geonexia.yml#L30

- **Lifecycle scripts are enabled by default in Yarn v2+.**
  .github/workflows/ios-submit-review-rocket-meals.yml:30
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-rocket-meals.yml#L30

- **Lifecycle scripts are enabled by default in Yarn v2+.**
  .github/workflows/ios-submit-review-score-tracker.yml:30
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-score-tracker.yml#L30

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/score-tracker/frontend/app/dice/index.tsx:53
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/dice/index.tsx#L53

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/score-tracker/frontend/app/games/[id].tsx:39
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L39

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/score-tracker/frontend/app/index.tsx:75
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L75

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/score-tracker/frontend/store/friendsSlice.ts:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/friendsSlice.ts#L19

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/score-tracker/frontend/store/gameTypesSlice.ts:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/gameTypesSlice.ts#L19

## 🐛 Reliability (42/54)

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/accessibilityTester/src/report.ts:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L108

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/accessibilityTester/src/report.ts:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L108

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/aachen/FoodWebParserAachenParseHtml.ts:40
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/aachen/FoodWebParserAachenParseHtml.ts#L40

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts:689
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts#L689

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts:577
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts#L577

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/helper/maxManager/MaxManagerConnector.ts:511
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/helper/maxManager/MaxManagerConnector.ts#L511

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L26

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:107
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L107

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/app/index.tsx:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/index.tsx#L16

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:21
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L21

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:20
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L20

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:22
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L22

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:24
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L24

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/EmailInput/EmailInput.tsx:9
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/EmailInput/EmailInput.tsx#L9

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/constants/MarkdownPatterns.ts:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/constants/MarkdownPatterns.ts#L16

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:94
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L94

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:119
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L119

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:161
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L161

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:168
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L168

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:143
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L143

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:151
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L151

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:76
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L76

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/activities/[id].tsx:400
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/[id].tsx#L400

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/activities/[id].tsx:424
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/[id].tsx#L424

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/activities/index.tsx:586
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/index.tsx#L586

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:114
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L114

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:487
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L487

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L108

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:510
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L510

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/index.tsx:3474
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L3474

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/index.tsx:5022
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L5022

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/routes/[id].tsx:606
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/routes/[id].tsx#L606

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/routes/[id].tsx:1206
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/routes/[id].tsx#L1206

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/settings/index.tsx:484
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/settings/index.tsx#L484

- **Consider using 'await' for the promise inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage.**
  apps/geonexia/frontend/app/settings/index.tsx:549
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/settings/index.tsx#L549

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/components/SettingsListBillboard/index.tsx:64
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListBillboard/index.tsx#L64

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/components/SettingsListHexTile/index.tsx:76
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListHexTile/index.tsx#L76

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/ActivityMapRebuildHelper.ts:363
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/ActivityMapRebuildHelper.ts#L363

- **Do not use an object literal as default for parameter `content`.**
  apps/geonexia/frontend/helpers/TTSHelper.ts:82
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/TTSHelper.ts#L82

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/score-tracker/frontend/app/dice/index.tsx:114
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/dice/index.tsx#L114

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:81
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L81

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L97

