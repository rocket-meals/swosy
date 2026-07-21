# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 1 | 1 |
| 🐛 Reliability | 32 | 32 |
| 🔧 Maintainability | 259 | 17 |

**Total issues:** 292 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (1/1)

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  scripts/count-sonar-maintainability-issues.js:93
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/count-sonar-maintainability-issues.js#L93

## 🐛 Reliability (32/32)

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
  apps/frontend/app/app/(app)/course-timetable/index.tsx:102
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L102

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/app/index.tsx:15
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/index.tsx#L15

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L16

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:15
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L15

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:17
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L17

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L19

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

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/ActivityMapRebuildHelper.ts:375
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/ActivityMapRebuildHelper.ts#L375

- **Do not use an object literal as default for parameter `content`.**
  apps/geonexia/frontend/helpers/TTSHelper.ts:82
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/TTSHelper.ts#L82

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:81
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L81

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L97

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:122
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L122

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:146
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L146

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:154
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L154

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:163
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L163

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:170
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L170

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/scripts/submit-ios-review.ts:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/submit-ios-review.ts#L26

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/EmailHelper.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/EmailHelper.ts#L2

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/NumberHelper.ts:38
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/NumberHelper.ts#L38

## 🔧 Maintainability (17/259)

- **Refactor this function to reduce its Cognitive Complexity from 35 to the 15 allowed.**
  apps/accessibilityTester/src/report.ts:110
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L110

- **Remove duplicates in this character class.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:244
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L244

- **Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts#L19

- **Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:298
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L298

- **Prefer `return value` over `return Promise.resolve(value)`.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/helper/maxManager/MaxManagerConnector.ts:455
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/helper/maxManager/MaxManagerConnector.ts#L455

- **Replace this "switch" statement by "if" statements to increase readability.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/index.ts:72
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/index.ts#L72

- **Refactor this function to reduce its Cognitive Complexity from 61 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:326
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L326

- **Method 'getFoodofferToCreate' has too many parameters (8). Maximum allowed is 7.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:941
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L941

- **'currentMealOffersHash.getHash()' may use Object's default stringification format ('[object Object]') when stringified.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:81
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L81

- **'previousMealOffersHash.getHash()' may use Object's default stringification format ('[object Object]') when stringified.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:95
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L95

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:709
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L709

- **Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:791
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L791

- **Refactor this function to reduce its Cognitive Complexity from 41 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:985
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L985

- **Refactor this function to not always return the same value.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foodoffers-components-hook/index.ts:10
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foodoffers-components-hook/index.ts#L10

- **Refactor this function to reduce its Cognitive Complexity from 38 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts:208
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts#L208

- **Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/forms-sync-hook/customers/hannover/HannoverTL1HousingFileReader.ts:101
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/forms-sync-hook/customers/hannover/HannoverTL1HousingFileReader.ts#L101

- **'lastResultHash.getHash()' may use Object's default stringification format ('[object Object]') when stringified.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/forms-sync-hook/FormImportSyncWorkflow.ts:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/forms-sync-hook/FormImportSyncWorkflow.ts#L31

