# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 4 | 4 |
| 🐛 Reliability | 6834 | 46 |
| 🔧 Maintainability | 10000 | 0 |

**Total issues:** 16838 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (4/4)

- **inputs.working-directory is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/check-build-number/action.yml:22
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/check-build-number/action.yml#L22

- **inputs.working-directory is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/check-build-number/action.yml:23
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/check-build-number/action.yml#L23

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/geonexia-expo-update/action.yml:184
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L184

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/geonexia-expo-update/action.yml:184
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L184

## 🐛 Reliability (46/6834)

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

- **React Hook "usePlatformHelper" cannot be called in a class component. React Hooks must be called in a React function component or a custom React Hook function.**
  apps/frontend/app/helper/NotificationHelper.ts:75
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/NotificationHelper.ts#L75

- **React Hook "usePlatformHelper" cannot be called at the top level. React Hooks must be called in a React function component or a custom React Hook function.**
  apps/frontend/app/helper/SystemActionHelper.ts:6
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/SystemActionHelper.ts#L6

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/activities/[id].tsx:184
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/[id].tsx#L184

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:67
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L67

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:113
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L113

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:485
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L485

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:493
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L493

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:494
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L494

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:60
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L60

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:106
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L106

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:499
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L499

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:507
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L507

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/hex-texture-config/index.tsx:508
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/hex-texture-config/index.tsx#L508

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/index.tsx:757
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L757

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/index.tsx:62
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L62

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/geonexia/frontend/app/index.tsx:2766
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L2766

- **Prefer `Number.parseFloat` over `parseFloat`.**
  apps/geonexia/frontend/app/index.tsx:1032
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L1032

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/geonexia/frontend/app/index.tsx:1033
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L1033

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/index.tsx:907
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L907

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/statistics/index.tsx:44
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/statistics/index.tsx#L44

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/components/SettingsListBillboard/index.tsx:72
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListBillboard/index.tsx#L72

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/components/SettingsListHexTile/index.tsx:84
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListHexTile/index.tsx#L84

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/components/SpeechSettingsModal.tsx:120
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SpeechSettingsModal.tsx#L120

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/geonexia/frontend/components/SpeechSettingsModal.tsx:121
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SpeechSettingsModal.tsx#L121

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/components/SpeechSettingsModal.tsx:159
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SpeechSettingsModal.tsx#L159

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/geonexia/frontend/components/SpeechSettingsModal.tsx:160
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SpeechSettingsModal.tsx#L160

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/ActivityMapRebuildHelper.ts:299
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/ActivityMapRebuildHelper.ts#L299

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/helpers/h3/h3core.js:242
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/h3core.js#L242

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/helpers/h3/h3core.js:243
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/h3core.js#L243

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/helpers/h3/h3core.js:261
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/h3core.js#L261

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/h3core.js:307
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/h3core.js#L307

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/h3core.js:307
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/h3core.js#L307

- **Remove this "===" check; it will always be false. Did you mean to use "=="?**
  apps/geonexia/frontend/helpers/h3/h3core.js:785
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/h3core.js#L785

- **Use `Math.trunc` instead of `>> 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:188
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L188

- **Use `Math.trunc` instead of `>> 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:191
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L191

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:200
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L200

- **Use `Math.trunc` instead of `~~`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:200
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L200

- **Use `Math.trunc` instead of `~~`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:200
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L200

- **Use `Math.trunc` instead of `>> 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:217
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L217

- **Use `Math.trunc` instead of `>> 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:219
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L219

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:312
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L312

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:317
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L317

