# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 4 | 4 |
| 🐛 Reliability | 6803 | 46 |
| 🔧 Maintainability | 10000 | 0 |

**Total issues:** 16807 (showing top 50 prioritized by: Security > Reliability > Maintainability)

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

## 🐛 Reliability (46/6803)

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx:140
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx#L140

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/activities/[id].tsx:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/[id].tsx#L50

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/activities/index.tsx:46
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/index.tsx#L46

- **Prefer `Number.parseFloat` over `parseFloat`.**
  apps/geonexia/frontend/app/index.tsx:530
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L530

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/geonexia/frontend/app/index.tsx:531
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L531

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/index.tsx:444
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L444

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

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:688
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L688

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:725
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L725

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:728
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L728

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:730
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L730

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:733
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L733

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:736
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L736

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:740
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L740

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:741
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L741

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:745
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L745

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:746
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L746

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:750
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L750

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:752
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L752

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:754
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L754

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:755
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L755

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:756
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L756

