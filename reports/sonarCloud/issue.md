# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 14 | 14 |
| 🐛 Reliability | 93 | 36 |
| 🔧 Maintainability | 1923 | 0 |

**Total issues:** 2030 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (14/14)

- **Use full commit SHA hash for this dependency.**
  .github/workflows/frontend-maestro.yml:44
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/frontend-maestro.yml#L44

- **Avoid executing downloaded artifacts directly without verification.**
  .github/workflows/frontend-maestro.yml:50
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/frontend-maestro.yml#L50

- **Not enforcing HTTPS here might allow for redirections to insecure websites. Make sure it is safe here.**
  .github/workflows/frontend-maestro.yml:50
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/frontend-maestro.yml#L50

- **"npx" can install packages on-demand and run their lifecycle scripts.**
  .github/workflows/pr-expo-preview.yml:246
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/pr-expo-preview.yml#L246

- **Define exact package version to avoid installing unverified releases.**
  .github/workflows/pr-expo-preview.yml:246
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/pr-expo-preview.yml#L246

- **LLMs running this code with faulty CLI arguments can escape from shell sandboxes. Refactor this code to validate untrusted data before passing them to OS commands.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:272
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L272

- **Review this potentially hard-coded password.**
  apps/backend-sync/src/SyncDatabaseSchema.ts:47
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/SyncDatabaseSchema.ts#L47

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/backend/Backend/scripts/getBase64IconForMail.py:46
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/scripts/getBase64IconForMail.py#L46

- **LLMs running this code with faulty CLI arguments can escape from shell sandboxes. Refactor this code to validate untrusted data before passing them to OS commands.**
  apps/backend/sync/importSchema.js:291
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L291

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/backend/sync/swosyDownloaderAndParser/swosyBuildingsJsonParseToRocketMealsJson.py:54
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/swosyDownloaderAndParser/swosyBuildingsJsonParseToRocketMealsJson.py#L54

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/googleMyMapKmlHelper/parseKmlToJsonBuildings.py:30
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/googleMyMapKmlHelper/parseKmlToJsonBuildings.py#L30

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/screenshotGenerator/src/helpers.ts:23
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/screenshotGenerator/src/helpers.ts#L23

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/screenshotGenerator/src/helpers.ts:87
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/screenshotGenerator/src/helpers.ts#L87

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/sonarCloudReportDownloader/src/fixStaticReadonly.ts:25
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/sonarCloudReportDownloader/src/fixStaticReadonly.ts#L25

## 🐛 Reliability (36/93)

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

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts:39
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts#L39

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:26
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L26

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:107
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L107

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/frontend/app/app/(app)/experimentell/onboarding/index.tsx:353
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/onboarding/index.tsx#L353

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx:140
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx#L140

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/frontend/app/app/(app)/settings/index.tsx:304
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/settings/index.tsx#L304

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/frontend/app/app/(app)/settings/index.tsx:305
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/settings/index.tsx#L305

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/frontend/app/app/(app)/settings/index.tsx:310
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/settings/index.tsx#L310

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/frontend/app/app/(app)/settings/index.tsx:312
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/settings/index.tsx#L312

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

- **React Hook "usePlatformHelper" is called in function "handleNativeLogin" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".**
  apps/frontend/app/helper/authHelper.ts:38
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/authHelper.ts#L38

- **React Hook "usePlatformHelper" is called in function "getIsLandScape" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".**
  apps/frontend/app/helper/DeviceHelper.ts:115
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/DeviceHelper.ts#L115

- **React Hook "usePlatformHelper" is called in function "getDeviceInformationWithoutPushToken" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".**
  apps/frontend/app/helper/DeviceHelper.ts:144
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/DeviceHelper.ts#L144

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/frontend/app/helper/FoodOffersCacheHelper.ts:15
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/FoodOffersCacheHelper.ts#L15

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/frontend/app/helper/FoodOffersCacheHelper.ts:101
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/FoodOffersCacheHelper.ts#L101

- **React Hook "usePlatformHelper" cannot be called in a class component. React Hooks must be called in a React function component or a custom React Hook function.**
  apps/frontend/app/helper/NotificationHelper.ts:82
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/NotificationHelper.ts#L82

- **React Hook "usePlatformHelper" cannot be called at the top level. React Hooks must be called in a React function component or a custom React Hook function.**
  apps/frontend/app/helper/SystemActionHelper.ts:6
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/SystemActionHelper.ts#L6

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/frontend/app/redux/actions/CanteenVisits/CanteenVisits.ts:92
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/redux/actions/CanteenVisits/CanteenVisits.ts#L92

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/frontend/app/redux/actions/CanteenVisits/CanteenVisits.ts:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/redux/actions/CanteenVisits/CanteenVisits.ts#L117

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

