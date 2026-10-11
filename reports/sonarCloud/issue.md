# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 4 | 4 |
| 🐛 Reliability | 2 | 2 |
| 🔧 Maintainability | 396 | 44 |

**Total issues:** 402 (showing top 50 prioritized by: Security > Reliability > Maintainability)

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

## 🐛 Reliability (2/2)

- **"tabindex" should only be declared on interactive elements.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/module-list/list-row.vue:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/module-list/list-row.vue#L11

- **Add a 'onKeyDown|onKeyUp' attribute to this <div> tag.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/support-chat/support-chat-conversation.vue:140
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/support-chat/support-chat-conversation.vue#L140

## 🔧 Maintainability (44/396)

- **Unexpected `await` inside a loop.**
  apps/accessibilityTester/src/index.ts:119
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/accessibilityTester/src/index.ts#L119

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

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/CollectionAutoTranslator.ts:173
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/CollectionAutoTranslator.ts#L173

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/CollectionAutoTranslator.ts:180
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/CollectionAutoTranslator.ts#L180

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/CollectionAutoTranslator.ts:323
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/CollectionAutoTranslator.ts#L323

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/index.ts:82
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/index.ts#L82

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/index.ts:81
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/index.ts#L81

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/base64-file-upload-hook/index.ts:60
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/base64-file-upload-hook/index.ts#L60

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts:63
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts#L63

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts#L50

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts:39
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts#L39

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts:69
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts#L69

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts:164
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts#L164

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts:168
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts#L168

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts:169
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts#L169

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts:171
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts#L171

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts:242
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/chat-conversation-state-hook/index.ts#L242

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:131
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L131

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L108

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:115
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L115

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:138
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L138

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:141
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L141

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts:41
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts#L41

- **Unexpected `await` inside a loop.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts:37
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts#L37

- **Move function 'getDashboardIdOfPanelPayload' to the outer scope.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts:172
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts#L172

- **Move function 'isProtectionActiveFor' to the outer scope.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts:63
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts#L63

- **Move function 'buildForbiddenError' to the outer scope.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts:67
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts#L67

