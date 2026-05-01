# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 14 | 14 |
| 🐛 Reliability | 6853 | 36 |
| 🔧 Maintainability | 10000 | 0 |

**Total issues:** 16867 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (14/14)

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

- **Review this potentially hard-coded password.**
  apps/backend-sync/src/SyncDatabaseSchema.ts:45
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/SyncDatabaseSchema.ts#L45

- **Change this code to not log user-controlled data.**
  apps/backend/sync/importSchema.js:234
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L234

- **Change this code to not log user-controlled data.**
  apps/backend/sync/importSchema.js:237
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L237

- **Change this code to not log user-controlled data.**
  apps/backend/sync/importSchema.js:240
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/sync/importSchema.js#L240

- **Ensure that tainted data is validated before being used to construct a client-side request URL.**
  apps/geonexia/frontend/helpers/h3/libh3.js:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L117

- **Ensure that tainted data is validated before being used to construct a client-side request URL.**
  apps/geonexia/frontend/helpers/h3/libh3.js:132
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L132

- **Ensure that tainted data is validated before being used to construct a client-side request URL.**
  apps/geonexia/frontend/helpers/h3/libh3.js:147
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L147

## 🐛 Reliability (36/6853)

- **React Hook "useIsLtrLanguage" cannot be called inside a callback. React Hooks must be called in a React function component or a custom React Hook function.**
  apps/frontend/app/app/(app)/form-submissions/index.tsx:386
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submissions/index.tsx#L386

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx:144
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx#L144

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:198
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L198

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:199
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L199

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:200
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L200

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:201
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L201

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:211
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L211

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:215
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L215

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:224
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L224

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/app/(auth)/login.tsx:225
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(auth)/login.tsx#L225

- **This conditional operation returns the same value whether the condition is "true" or "false".**
  apps/frontend/app/components/CourseTimeTable/CourseBottomSheet.tsx:407
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CourseTimeTable/CourseBottomSheet.tsx#L407

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:171
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L171

- **React Hook "useIsLtrLanguage" is called in function "getContent" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".**
  apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx:202
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/CustomMarkdown/CustomMarkdown.tsx#L202

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/components/MyMarkdown/MyMarkdown.tsx:35
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/MyMarkdown/MyMarkdown.tsx#L35

- **React Hook "usePlatformHelper" is called in function "handleNativeLogin" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".**
  apps/frontend/app/helper/authHelper.ts:38
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/authHelper.ts#L38

- **React Hook "usePlatformHelper" is called in function "getIsLandScape" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".**
  apps/frontend/app/helper/DeviceHelper.ts:115
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/DeviceHelper.ts#L115

- **React Hook "usePlatformHelper" is called in function "getDeviceInformationWithoutPushToken" that is neither a React function component nor a custom React Hook function. React component names must start with an uppercase letter. React Hook names must start with the word "use".**
  apps/frontend/app/helper/DeviceHelper.ts:144
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/DeviceHelper.ts#L144

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

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/activities/[id].tsx:187
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/[id].tsx#L187

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:68
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L68

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:114
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L114

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:487
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L487

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:495
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L495

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:496
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L496

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:108
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L108

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:510
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L510

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:518
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L518

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:519
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L519

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/geonexia/frontend/app/index.tsx:1868
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L1868

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/index.tsx:111
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L111

- **Prefer `Number.parseFloat` over `parseFloat`.**
  apps/geonexia/frontend/app/index.tsx:1170
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L1170

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/index.tsx:766
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L766

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/index.tsx:60
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L60

