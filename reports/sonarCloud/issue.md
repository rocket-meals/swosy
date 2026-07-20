# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 1 | 1 |
| 🐛 Reliability | 42 | 42 |
| 🔧 Maintainability | 602 | 7 |

**Total issues:** 645 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (1/1)

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  scripts/count-sonar-maintainability-issues.js:93
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/count-sonar-maintainability-issues.js#L93

## 🐛 Reliability (42/42)

- **This pattern can be replaced with '|'.**
  apps/accessibilityTester/src/report.ts:107
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L107

- **This pattern can be replaced with '\n'.**
  apps/accessibilityTester/src/report.ts:107
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L107

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

- **This pattern can be replaced with '"'.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:114
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L114

- **This pattern can be replaced with '"'.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:487
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L487

- **This pattern can be replaced with '"'.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L108

- **This pattern can be replaced with '"'.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:510
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L510

- **This pattern can be replaced with '"'.**
  apps/geonexia/frontend/components/SettingsListBillboard/index.tsx:64
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListBillboard/index.tsx#L64

- **This pattern can be replaced with '"'.**
  apps/geonexia/frontend/components/SettingsListHexTile/index.tsx:76
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListHexTile/index.tsx#L76

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

- **This pattern can be replaced with '+'.**
  apps/scripts/submit-ios-review.ts:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/submit-ios-review.ts#L26

- **This pattern can be replaced with '/'.**
  apps/scripts/submit-ios-review.ts:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/submit-ios-review.ts#L26

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/scripts/submit-ios-review.ts:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/scripts/submit-ios-review.ts#L26

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/EmailHelper.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/EmailHelper.ts#L2

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/NumberHelper.ts:38
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/NumberHelper.ts#L38

## 🔧 Maintainability (7/602)

- **This pattern can be replaced with '|'.**
  apps/accessibilityTester/src/report.ts:107
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L107

- **This pattern can be replaced with '\n'.**
  apps/accessibilityTester/src/report.ts:107
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/report.ts#L107

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

- **`FILE_FIELD_SPECIALS` should be a `Set`, and use `FILE_FIELD_SPECIALS.has()` to check existence or non-existence.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/base64-file-upload-hook/index.ts:15
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/base64-file-upload-hook/index.ts#L15

