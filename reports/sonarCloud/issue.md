# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 1 | 1 |
| 🐛 Reliability | 3 | 3 |
| 🔧 Maintainability | 6 | 6 |

**Total issues:** 10

---

## 🔒 Security (1/1)

- **CORS Injection via unsanitized user input**
  apps/maintenance-server/server.mjs:124
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L124

## 🐛 Reliability (3/3)

- **Async method 'handleNotification' has no 'await' expression.**
  apps/frontend/app/helper/NotificationHelper.ts:87
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/NotificationHelper.ts#L87

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/maintenance-server/server.mjs:167
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L167

- **Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator.**
  apps/maintenance-server/server.mjs:190
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L190

## 🔧 Maintainability (6/6)

- **Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts:76
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/feature-wishes-hook/index.ts#L76

- **Extract this nested ternary operation into an independent statement.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts:810
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts#L810

- **Replace this union type with a type alias.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts:689
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/rocket-meals-module/LivePulseHelper.ts#L689

- **Async method 'handleNotification' has no 'await' expression.**
  apps/frontend/app/helper/NotificationHelper.ts:87
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/NotificationHelper.ts#L87

- **Move function 'setCorsHeaders' to the outer scope.**
  apps/maintenance-server/server.mjs:120
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L120

- **Move function 'sendJson' to the outer scope.**
  apps/maintenance-server/server.mjs:132
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/maintenance-server/server.mjs#L132

