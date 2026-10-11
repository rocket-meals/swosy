# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 4 | 4 |
| 🐛 Reliability | 21 | 21 |
| 🔧 Maintainability | 421 | 25 |

**Total issues:** 446 (showing top 50 prioritized by: Security > Reliability > Maintainability)

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

- **Log Injection via unsanitized user input**
  scripts/maintenance-window.mjs:51
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/maintenance-window.mjs#L51

## 🐛 Reliability (21/21)

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts:62
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts#L62

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/ai/DirectusOpenAiCompatibleClient.ts:110
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/ai/DirectusOpenAiCompatibleClient.ts#L110

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/extended-panels/ExtendedPanelHelper.ts:106
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/extended-panels/ExtendedPanelHelper.ts#L106

- **Use `Math.trunc` instead of `| 0`.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts:565
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts#L565

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts:565
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts#L565

- **A form label must be associated with a control and have accessible text.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue:397
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue#L397

- **A form label must be associated with a control and have accessible text.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue:401
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue#L401

- **Add a 'onKeyDown|onKeyUp' attribute to this <div> tag.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/module-list/list-row.vue:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/module-list/list-row.vue#L11

- **Add a 'onKeyDown|onKeyUp' attribute to this <div> tag.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/module-list/list-row.vue:12
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/module-list/list-row.vue#L12

- **A form label must be associated with a control and have accessible text.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/profiles/profile-push-page.vue:156
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/profiles/profile-push-page.vue#L156

- **A form label must be associated with a control and have accessible text.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/profiles/profile-push-page.vue:164
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/profiles/profile-push-page.vue#L164

- **A form label must be associated with a control and have accessible text.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/profiles/profile-push-page.vue:172
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/profiles/profile-push-page.vue#L172

- **Add a 'onKeyDown|onKeyUp' attribute to this <div> tag.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/support-chat/support-chat-conversation.vue:136
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/support-chat/support-chat-conversation.vue#L136

- **Add an "id" attribute to this input field and associate it with a label.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/support-chat/support-chat-conversation.vue:137
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/support-chat/support-chat-conversation.vue#L137

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/frontend/app/helper/authSessionHelper.ts:119
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/authSessionHelper.ts#L119

- **Prefer `String#replaceAll()` over `String#split().join()`.**
  apps/frontend/app/helper/DirectusFieldChoiceHelper.ts:78
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/DirectusFieldChoiceHelper.ts#L78

- **Do not use an object literal as default for parameter `options`.**
  apps/frontend/app/helper/getPushToken.ts:13
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/getPushToken.ts#L13

- **Prefer `String#replaceAll()` over `String#split().join()`.**
  apps/frontend/app/helper/housingAnalytics/HousingAnalyticsCsv.ts:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/housingAnalytics/HousingAnalyticsCsv.ts#L50

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/frontend/app/helper/textRecognitionPage/page.ts:68
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/textRecognitionPage/page.ts#L68

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/FoodofferPriceHelper.ts:227
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/FoodofferPriceHelper.ts#L227

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  packages/common/src/form/IbanValidationHelper.ts:124
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/form/IbanValidationHelper.ts#L124

## 🔧 Maintainability (25/421)

- **Unexpected `await` inside a loop.**
  apps/accessibilityTester/src/index.ts:119
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/index.ts#L119

- **Unexpected `await` of a non-Promise (non-"Thenable") value.**
  apps/backend-sync/src/apple-secret-rotator/index.ts:121
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/index.ts#L121

- **Unexpected `await` of a non-Promise (non-"Thenable") value.**
  apps/backend-sync/src/apple-secret-rotator/index.ts:129
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/index.ts#L129

- **Unexpected `await` of a non-Promise (non-"Thenable") value.**
  apps/backend-sync/src/apple-secret-rotator/index.ts:135
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/index.ts#L135

- **Unexpected `await` of a non-Promise (non-"Thenable") value.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:85
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L85

- **Unexpected `await` of a non-Promise (non-"Thenable") value.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:104
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L104

- **Unexpected `await` inside a loop.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:129
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L129

- **Unexpected `await` inside a loop.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:377
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L377

- **Unnecessary use of conditional expression for default assignment.**
  apps/backend-sync/src/DirectusSettingsDumpHelper.ts:126
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusSettingsDumpHelper.ts#L126

- **Unexpected `await` inside a loop.**
  apps/backend-sync/src/DirectusSyncSettingsIdMigration.ts:33
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusSyncSettingsIdMigration.ts#L33

- **Unexpected `await` inside a loop.**
  apps/backend-sync/src/DockerContainerManager.ts:88
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerContainerManager.ts#L88

- **Unexpected `await` inside a loop.**
  apps/backend-sync/src/DockerDirectusPingHelper.ts:54
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerDirectusPingHelper.ts#L54

- **`optionalDependencies` should be a `Set`, and use `optionalDependencies.has()` to check existence or non-existence.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/extension.config.mjs:69
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/extension.config.mjs#L69

- **Prefer using an optional chain expression instead, as it's more concise and easier to read.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/extension.config.mjs:74
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/extension.config.mjs#L74

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts#L117

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts#L97

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts:102
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts#L102

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts:103
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts#L103

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts:111
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/apartments-free-notify-schedule-hook/FreeApartmentsNotifier.ts#L111

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts:139
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts#L139

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts:141
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts#L141

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts:110
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts#L110

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts:175
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts#L175

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts:160
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-reviews-pull-hook/index.ts#L160

- **Unexpected `await` of a non-Promise (non-"Thenable") value.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/AutoTranslator.ts:115
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/AutoTranslator.ts#L115

