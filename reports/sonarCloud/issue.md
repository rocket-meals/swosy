# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 4 | 4 |
| 🐛 Reliability | 400 | 46 |
| 🔧 Maintainability | 751 | 0 |

**Total issues:** 1155 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (4/4)

- **Move this write permission from workflow level to job level.**
  .github/workflows/sync-fork.yml:4
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/sync-fork.yml#L4

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue:364
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue#L364

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/frontend/app/helper/courseTimetable/CourseTimetableModel.ts:164
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/courseTimetable/CourseTimetableModel.ts#L164

- **Code Injection via unsanitized user input**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:10
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L10

## 🐛 Reliability (46/400)

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
  apps/backend-sync/src/DirectusDatabaseSync.ts:142
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L142

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
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/index.ts:43
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/index.ts#L43

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/index.ts:44
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/index.ts#L44

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts#L108

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-usage-events-cleanup-schedule/index.ts:56
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-usage-events-cleanup-schedule/index.ts#L56

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-usage-events-cleanup-schedule/index.ts:57
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-usage-events-cleanup-schedule/index.ts#L57

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
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts:18
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts#L18

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

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts:62
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts#L62

- **Async arrow function has no 'await' expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts:65
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts#L65

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
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts#L8

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

