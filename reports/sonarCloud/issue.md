# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 3 | 3 |
| 🐛 Reliability | 30 | 30 |
| 🔧 Maintainability | 87 | 17 |

**Total issues:** 120 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (3/3)

- **Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation.**
  apps/backend/Dockerfile:36
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Dockerfile#L36

- **Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation.**
  apps/backend/Dockerfile:37
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Dockerfile#L37

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  scripts/count-sonar-maintainability-issues.js:93
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/count-sonar-maintainability-issues.js#L93

## 🐛 Reliability (30/30)

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
  apps/frontend/run-maestro-web-test.sh:96
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L96

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:121
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L121

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:163
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L163

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:170
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L170

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:145
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L145

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:153
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L153

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/run-maestro-web-test.sh:78
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L78

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:83
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L83

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:99
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L99

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:124
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L124

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:148
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L148

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:156
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L156

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:165
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L165

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/score-tracker/run-maestro-web-test.sh:172
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/run-maestro-web-test.sh#L172

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/scripts/submit-ios-review.ts:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/submit-ios-review.ts#L26

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/EmailHelper.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/EmailHelper.ts#L2

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/NumberHelper.ts:38
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/NumberHelper.ts#L38

## 🔧 Maintainability (17/87)

- **Do not call `Array#push()` multiple times.**
  apps/accessibilityTester/src/report.ts:235
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L235

- **Async method 'translateFieldsForTranslation' has too many parameters (10). Maximum allowed is 7.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts:383
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts#L383

- **Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts:208
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts#L208

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/mails-hook/index.ts:77
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/mails-hook/index.ts#L77

- **Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/redirect-with-token-endpoint/index.ts:179
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/redirect-with-token-endpoint/index.ts#L179

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L108

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:114
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L114

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/experimentell/expo-update-test/index.tsx:181
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/expo-update-test/index.tsx#L181

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx:148
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx#L148

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx:152
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx#L152

- **Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.**
  apps/frontend/app/app/(app)/foodoffers/details/components/FoodHeader.tsx:116
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/foodoffers/details/components/FoodHeader.tsx#L116

- **Prefer `node:buffer` over `buffer`.**
  apps/frontend/app/app/(app)/form-queue/index.tsx:20
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-queue/index.tsx#L20

- **Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.**
  apps/frontend/app/app/(app)/form-submission/index.tsx:319
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submission/index.tsx#L319

- **Async function 'buildUpdatedValueFieldsForAnswer' has too many parameters (9). Maximum allowed is 7.**
  apps/frontend/app/app/(app)/form-submission/index.tsx:419
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submission/index.tsx#L419

- **Prefer `node:buffer` over `buffer`.**
  apps/frontend/app/app/(app)/form-submission/index.tsx:42
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submission/index.tsx#L42

- **Provide multiple methods instead of using "append" to determine which action to take.**
  apps/frontend/app/app/(app)/form-submissions/index.tsx:109
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submissions/index.tsx#L109

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/map/index.tsx:1750
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/map/index.tsx#L1750

