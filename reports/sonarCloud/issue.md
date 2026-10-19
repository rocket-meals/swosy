# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 3 | 3 |
| 🐛 Reliability | 5 | 5 |
| 🔧 Maintainability | 25 | 25 |

**Total issues:** 33

---

## 🔒 Security (3/3)

- **Make sure the "PATH" variable only contains fixed, unwriteable directories.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/extension.config.mjs:100
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/extension.config.mjs#L100

- **Client-Side Request Forgery via unsanitized user input**
  apps/maintenance-server/server.mjs:156
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L156

- **CORS Injection via unsanitized user input**
  apps/maintenance-server/server.mjs:197
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L197

## 🐛 Reliability (5/5)

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/frontend/app/app/(app)/experimentell/store-versions/index.tsx:92
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/store-versions/index.tsx#L92

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/frontend/app/app/(app)/experimentell/store-versions/index.tsx:93
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/store-versions/index.tsx#L93

- **Async method 'handleNotification' has no 'await' expression.**
  apps/frontend/app/helper/NotificationHelper.ts:87
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/NotificationHelper.ts#L87

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/maintenance-server/server.mjs:279
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L279

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/maintenance-server/server.mjs:303
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L303

## 🔧 Maintainability (25/25)

- **Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts:76
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts#L76

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationPrompt.ts:115
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationPrompt.ts#L115

- **'raw.id' will use Object's default stringification format ('[object Object]') when stringified.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationPrompt.ts:125
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationPrompt.ts#L125

- **Move this array "reverse" operation to a separate statement or replace it with "toReversed".**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts:209
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts#L209

- **Extract the assignment of "messagesByItem[item]" from this expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts:214
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts#L214

- **Refactor this code to not use nested template literals.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts:161
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts#L161

- **Extract this nested ternary operation into an independent statement.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts:171
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/action-recommendations/ActionRecommendationService.ts#L171

- **Extract this nested ternary operation into an independent statement.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts:810
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts#L810

- **Replace this union type with a type alias.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts:689
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts#L689

- **`keptIds` should be a `Set`, and use `keptIds.has()` to check existence or non-existence.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/NewsModuleHelper.ts:421
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/NewsModuleHelper.ts#L421

- **`editable` should be a `Set`, and use `editable.has()` to check existence or non-existence.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/legal-documents-hook/LegalWikiProtection.ts:45
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/legal-documents-hook/LegalWikiProtection.ts#L45

- **Extract this nested ternary operation into an independent statement.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/communication/news-editor-page.vue:120
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/communication/news-editor-page.vue#L120

- **Use <address> or <details> or <fieldset> or <optgroup> instead of the group role to ensure accessibility across all devices.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/communication/news-editor-page.vue:344
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/communication/news-editor-page.vue#L344

- **Remove this "!important" and resolve the specificity conflict instead.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue:706
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/rocket-meals-module/friendship-network/friendship-network-page.vue#L706

- **'repo-depkit-common-ui' imported multiple times.**
  apps/frontend/app/app/(app)/experimentell/onboarding/index.tsx:41
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/onboarding/index.tsx#L41

- **'repo-depkit-common-ui' imported multiple times.**
  apps/frontend/app/app/(app)/experimentell/onboarding/index.tsx:25
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/onboarding/index.tsx#L25

- **Extract this nested ternary operation into an independent statement.**
  apps/frontend/app/components/NewsFoodoffersHint/index.tsx:59
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/NewsFoodoffersHint/index.tsx#L59

- **Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.**
  apps/frontend/app/components/OwnFoodFeedbackItem/index.tsx:36
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/OwnFoodFeedbackItem/index.tsx#L36

- **Unexpected `await` inside a loop.**
  apps/frontend/app/helper/chatReadStatus.ts:90
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/chatReadStatus.ts#L90

- **Async method 'handleNotification' has no 'await' expression.**
  apps/frontend/app/helper/NotificationHelper.ts:87
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/NotificationHelper.ts#L87

- **Move function 'setCorsHeaders' to the outer scope.**
  apps/maintenance-server/server.mjs:193
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L193

- **Move function 'sendJson' to the outer scope.**
  apps/maintenance-server/server.mjs:205
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L205

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  packages/common-ui/src/components/SettingsList/SettingsList.tsx:166
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common-ui/src/components/SettingsList/SettingsList.tsx#L166

- **Extract this nested ternary operation into an independent statement.**
  packages/common/src/EventHelper.ts:42
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/EventHelper.ts#L42

- **arrow function is equivalent to `String`. Use `String` directly.**
  packages/common/src/EventHelper.ts:196
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/EventHelper.ts#L196

