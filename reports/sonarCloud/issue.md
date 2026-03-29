# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 4 | 4 |
| 🐛 Reliability | 6818 | 46 |
| 🔧 Maintainability | 10000 | 0 |

**Total issues:** 16822 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (4/4)

- **inputs.working-directory is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/check-build-number/action.yml:22
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/check-build-number/action.yml#L22

- **inputs.working-directory is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/check-build-number/action.yml:23
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/check-build-number/action.yml#L23

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/geonexia-expo-update/action.yml:164
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L164

- **inputs.ref_name is vulnerable to script injection: values of inputs are provided by whoever triggers the workflow. Change this action to not use user-controlled data directly in a run block, for example by assigning this expression to an environment variable.**
  .github/actions/geonexia-expo-update/action.yml:164
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L164

## 🐛 Reliability (46/6818)

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
  apps/geonexia/frontend/app/activities/[id].tsx:153
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/[id].tsx#L153

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/activities/index.tsx:53
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/index.tsx#L53

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:67
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L67

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:113
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L113

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:479
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L479

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:487
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L487

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/billboard-config/index.tsx:488
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/billboard-config/index.tsx#L488

- **Prefer `Number.parseInt` over `parseInt`.**
  apps/geonexia/frontend/app/index.tsx:44
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L44

- **Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically.**
  apps/geonexia/frontend/app/index.tsx:1677
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L1677

- **Prefer `Number.parseFloat` over `parseFloat`.**
  apps/geonexia/frontend/app/index.tsx:822
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L822

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/geonexia/frontend/app/index.tsx:823
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L823

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/index.tsx:710
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L710

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/statistics/index.tsx:44
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/statistics/index.tsx#L44

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/components/SettingsListBillboard/index.tsx:65
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListBillboard/index.tsx#L65

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/geonexia/frontend/components/SettingsListHexTile/index.tsx:76
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/components/SettingsListHexTile/index.tsx#L76

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

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:327
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L327

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:330
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L330

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:344
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L344

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:346
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L346

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:597
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L597

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:616
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L616

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:618
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L618

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:621
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L621

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:640
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L640

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:687
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L687

