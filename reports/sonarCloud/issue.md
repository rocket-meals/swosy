# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 3 | 3 |
| 🐛 Reliability | 1 | 1 |
| 🔧 Maintainability | 87 | 46 |

**Total issues:** 91 (showing top 50 prioritized by: Security > Reliability > Maintainability)

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

## 🐛 Reliability (1/1)

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/constants/MarkdownPatterns.ts:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/constants/MarkdownPatterns.ts#L16

## 🔧 Maintainability (46/87)

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
  apps/frontend/app/app/(app)/course-timetable/index.tsx:91
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L91

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L97

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

- **Unnecessary use of conditional expression for default assignment.**
  apps/frontend/app/app/(monitor)/bigScreen/index.tsx:71
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/bigScreen/index.tsx#L71

- **Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.**
  apps/frontend/app/app/(monitor)/bigScreen/index.tsx:84
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/bigScreen/index.tsx#L84

- **The signature '(...text: string[]): void | undefined' of 'newWindow.document.write' is deprecated.**
  apps/frontend/app/app/(monitor)/list-week-screen/details/index.tsx:417
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/list-week-screen/details/index.tsx#L417

- **Do not use Array index in keys**
  apps/frontend/app/app/(monitor)/rss-feed-config/index.tsx:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/rss-feed-config/index.tsx#L31

- **'any' overrides all other types in this union type.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:96
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L96

- **Do not use Array index in keys**
  apps/frontend/app/components/DataAcces/DataAccess.tsx:25
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/DataAcces/DataAccess.tsx#L25

- **Do not use Array index in keys**
  apps/frontend/app/components/DataAcces/DataAccess.tsx:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/DataAcces/DataAccess.tsx#L31

- **Do not use Array index in keys**
  apps/frontend/app/components/DataAcces/DataAccess.tsx:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/DataAcces/DataAccess.tsx#L19

- **Move this component definition out of the parent component and pass data as props.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:324
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L324

- **Arrow function has too many parameters (8). Maximum allowed is 7.**
  apps/frontend/app/components/ManagmentFoodPlan/FoodPlan.tsx:17
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/ManagmentFoodPlan/FoodPlan.tsx#L17

- **Provide multiple methods instead of using "like" to determine which action to take.**
  apps/frontend/app/components/MarkingLabels/MarkingLabels.tsx:141
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/MarkingLabels/MarkingLabels.tsx#L141

- **Do not use Array index in keys**
  apps/frontend/app/components/RateAppSettingsItem/RateAppSettingsItem.tsx:101
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/RateAppSettingsItem/RateAppSettingsItem.tsx#L101

- **Provide multiple methods instead of using "like" to determine which action to take.**
  apps/frontend/app/components/SettingsListMarkingLabel/SettingsListMarkingLabel.tsx:148
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/SettingsListMarkingLabel/SettingsListMarkingLabel.tsx#L148

- **Prefer `structuredClone(…)` over `JSON.parse(JSON.stringify(…))` to create a deep clone.**
  apps/frontend/app/helper/animationHelper.ts:175
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/animationHelper.ts#L175

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:93
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L93

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L97

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:101
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L101

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:105
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L105

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:109
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L109

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:113
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L113

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L117

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:121
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L121

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:125
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L125

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:129
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L129

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:133
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L133

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:137
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L137

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:141
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L141

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:145
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L145

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:149
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L149

