# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 2 | 2 |
| 🐛 Reliability | 367 | 48 |
| 🔧 Maintainability | 633 | 0 |

**Total issues:** 1002 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (2/2)

- **Move this write permission from workflow level to job level.**
  .github/workflows/sync-fork.yml:4
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/sync-fork.yml#L4

- **Code Injection via unsanitized user input**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:10
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L10

## 🐛 Reliability (48/367)

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/accessibilityTester/src/index.ts:104
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/index.ts#L104

- **Async function 'refreshSecret' has no 'await' expression.**
  apps/backend-sync/src/apple-secret-rotator/index.ts:82
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/index.ts#L82

- **Async arrow function 'shutdown' has no 'await' expression.**
  apps/backend-sync/src/CronHelperManager.ts:23
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/CronHelperManager.ts#L23

- **Async method 'copyFromDirectusConfigOverwriteFolderIntoDirectusConfigFolder' has no 'await' expression.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:131
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L131

- **Async function 'findFileUpwards' has no 'await' expression.**
  apps/backend-sync/src/EnvFileFinder.ts:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/EnvFileFinder.ts#L4

- **Static async method 'fetch' has no 'await' expression.**
  apps/backend-sync/src/FetchIgnoreSelfSignedCertHelper.ts:5
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/FetchIgnoreSelfSignedCertHelper.ts#L5

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend-sync/src/index.ts:77
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/index.ts#L77

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend-sync/src/SyncDatabaseSchemaProgramm.ts:23
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/SyncDatabaseSchemaProgramm.ts#L23

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts:6
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts#L6

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/admin-password-setup-from-env/index.ts:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/admin-password-setup-from-env/index.ts#L8

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts:110
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts#L110

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apple-secret-rotator/index.ts:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apple-secret-rotator/index.ts#L4

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apple-secret-rotator/index.ts:5
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apple-secret-rotator/index.ts#L5

- **Async method 'getAuthKey' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/AutoTranslatorSettings.ts:34
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/AutoTranslatorSettings.ts#L34

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/index.ts:102
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/index.ts#L102

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/index.ts:43
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/index.ts#L43

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/index.ts:70
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/index.ts#L70

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts#L11

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts#L26

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts:30
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts#L30

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:157
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L157

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:160
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L160

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts#L8

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts:34
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts#L34

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:349
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L349

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:345
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L345

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/files-without-folder-report-schedule/index.ts:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/files-without-folder-report-schedule/index.ts#L117

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-guest-restriction-hook/index.ts:32
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-guest-restriction-hook/index.ts#L32

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts:34
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts#L34

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts:7
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts#L7

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:7
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L7

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-image-ai-generation-hook/index.ts:195
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-image-ai-generation-hook/index.ts#L195

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-image-ai-generation-hook/index.ts:199
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-image-ai-generation-hook/index.ts#L199

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-notify-schedule-hook/index.ts:32
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-notify-schedule-hook/index.ts#L32

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-notify-schedule-hook/index.ts:35
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-notify-schedule-hook/index.ts#L35

- **Async method 'getHtmlFilesForCanteens' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/aachen/FoodWebParser_RawReportTestReaderAachen.ts:15
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/aachen/FoodWebParser_RawReportTestReaderAachen.ts#L15

- **Async method 'getRawFoodofferJSONListFromRawReport' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts:294
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts#L294

- **Async method 'getCanteensList' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts:182
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts#L182

- **Async method 'getFoodoffersForParser' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts:229
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts#L229

- **Async method 'getFoodsListForParser' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts:125
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/FoodTL1Parser.ts#L125

- **Async method 'getMarkingsJSONList' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/helper/maxManager/MaxManagerConnector.ts:484
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/helper/maxManager/MaxManagerConnector.ts#L484

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/index.ts:116
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/index.ts#L116

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/index.ts:119
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/index.ts#L119

- **Async method 'getMarkingsJSONList' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/MarkingTL1Parser.ts:28
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/MarkingTL1Parser.ts#L28

- **Async method 'getSavedRawReport' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/osnabrueck/FoodTL1ParserRawReportTestReaderOsnabrueck.ts:42
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/osnabrueck/FoodTL1ParserRawReportTestReaderOsnabrueck.ts#L42

- **Async method 'getFoodsService' has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts:292
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-sync-hook/ParseSchedule.ts#L292

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foodoffers-components-hook/index.ts:7
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foodoffers-components-hook/index.ts#L7

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts:528
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts#L528

