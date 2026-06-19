# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 39 | 39 |
| 🐛 Reliability | 6850 | 11 |
| 🔧 Maintainability | 10000 | 0 |

**Total issues:** 16889 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (39/39)

- **inputs.previous-commit-sha is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/check-build-number/action.yml:34
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/check-build-number/action.yml#L34

- **inputs.working-directory is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/check-build-number/action.yml:42
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/check-build-number/action.yml#L42

- **inputs.working-directory is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/check-build-number/action.yml:43
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/check-build-number/action.yml#L43

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/geonexia-expo-update/action.yml:184
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L184

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/geonexia-expo-update/action.yml:184
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L184

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/score-tracker-expo-update/action.yml:184
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/score-tracker-expo-update/action.yml#L184

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/score-tracker-expo-update/action.yml:184
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/score-tracker-expo-update/action.yml#L184

- **Use full commit SHA hash for this dependency.**
  .github/workflows/frontend-maestro.yml:44
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/frontend-maestro.yml#L44

- **Avoid executing downloaded artifacts directly without verification.**
  .github/workflows/frontend-maestro.yml:50
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/frontend-maestro.yml#L50

- **Not enforcing HTTPS here might allow for redirections to insecure websites. Make sure it is safe here.**
  .github/workflows/frontend-maestro.yml:50
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/frontend-maestro.yml#L50

- **The expression github.event.pull_request.title can be set by an external actor to a specially crafted value, enabling script injection. Change this workflow to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/workflows/pr-expo-preview.yml:51
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/pr-expo-preview.yml#L51

- **The expression github.event.pull_request.title can be set by an external actor to a specially crafted value, enabling script injection. Change this workflow to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/workflows/pr-expo-preview.yml:60
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/pr-expo-preview.yml#L60

- **The expression github.event.pull_request.title can be set by an external actor to a specially crafted value, enabling script injection. Change this workflow to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/workflows/pr-expo-preview.yml:69
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/pr-expo-preview.yml#L69

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:75
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L75

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:103
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L103

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:315
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L315

- **LLMs running this code with faulty CLI arguments can escape from shell sandboxes. Refactor this code to validate untrusted OS commands before using them.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:251
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L251

- **Review this potentially hard-coded password.**
  apps/backend-sync/src/SyncDatabaseSchema.ts:45
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/SyncDatabaseSchema.ts#L45

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/backend/Backend/scripts/getBase64IconForMail.py:45
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/scripts/getBase64IconForMail.py#L45

- **LLMs running this code with faulty CLI arguments can escape from shell sandboxes. Refactor this code to validate untrusted OS commands before using them.**
  apps/backend/sync/importSchema.js:274
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L274

- **LLMs running this code with faulty CLI arguments can cause SSRFs. Refactor this code to validate strings before using them in network requests.**
  apps/backend/sync/importSchema.js:465
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L465

- **LLMs running this code with faulty CLI arguments can cause SSRFs. Refactor this code to validate strings before using them in network requests.**
  apps/backend/sync/importSchema.js:499
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L499

- **LLMs running this code with faulty CLI arguments can cause SSRFs. Refactor this code to validate strings before using them in network requests.**
  apps/backend/sync/importSchema.js:548
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L548

- **Change this code to not log user-controlled data.**
  apps/backend/sync/importSchema.js:234
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L234

- **Change this code to not log user-controlled data.**
  apps/backend/sync/importSchema.js:237
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L237

- **Change this code to not log user-controlled data.**
  apps/backend/sync/importSchema.js:240
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L240

- **LLMs running this code with faulty CLI arguments can cause SSRFs. Refactor this code to validate strings before using them in network requests.**
  apps/backend/sync/importSchema.js:212
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L212

- **LLMs running this code with faulty CLI arguments can cause SSRFs. Refactor this code to validate strings before using them in network requests.**
  apps/backend/sync/importSchema.js:245
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L245

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/backend/sync/swosyDownloaderAndParser/swosyBuildingsJsonParseToRocketMealsJson.py:53
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/swosyDownloaderAndParser/swosyBuildingsJsonParseToRocketMealsJson.py#L53

- **Not enforcing HTTPS here might allow for redirections to insecure websites. Make sure it is safe here.**
  apps/frontend/run-maestro-web-test.sh:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/run-maestro-web-test.sh#L31

- **Ensure that tainted data is validated before being used to construct a client-side request URL.**
  apps/geonexia/frontend/helpers/h3/libh3.js:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L117

- **Ensure that tainted data is validated before being used to construct a client-side request URL.**
  apps/geonexia/frontend/helpers/h3/libh3.js:132
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L132

- **Ensure that tainted data is validated before being used to construct a client-side request URL.**
  apps/geonexia/frontend/helpers/h3/libh3.js:147
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L147

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/googleMyMapKmlHelper/parseKmlToJsonBuildings.py:29
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/googleMyMapKmlHelper/parseKmlToJsonBuildings.py#L29

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/screenshotGenerator/src/helpers.ts:9
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/screenshotGenerator/src/helpers.ts#L9

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  apps/screenshotGenerator/src/helpers.ts:72
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/screenshotGenerator/src/helpers.ts#L72

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/sonarCloudReportDownloader/src/fixStaticReadonly.ts:25
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/sonarCloudReportDownloader/src/fixStaticReadonly.ts#L25

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/sonarCloudReportDownloader/src/generateIssueMarkdown.ts:332
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/sonarCloudReportDownloader/src/generateIssueMarkdown.ts#L332

- **A path canonicalized from CLI-controlled data must be validated before use.**
  apps/sonarCloudReportDownloader/src/generateIssueMarkdown.ts:333
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/sonarCloudReportDownloader/src/generateIssueMarkdown.ts#L333

## 🐛 Reliability (11/6850)

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts:39
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/foods-translation-fix-missing-schedule/index.ts#L39

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx:140
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx#L140

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

