# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 2 | 2 |
| 🐛 Reliability | 6799 | 48 |
| 🔧 Maintainability | 10000 | 0 |

**Total issues:** 16801 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (2/2)

- **Change this action to not use user-controlled data directly in a run block.**
  .github/actions/geonexia-expo-update/action.yml:164
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L164

- **Change this action to not use user-controlled data directly in a run block.**
  .github/actions/geonexia-expo-update/action.yml:164
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/actions/geonexia-expo-update/action.yml#L164

## 🐛 Reliability (48/6799)

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx:140
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/map/components/JoggingOverlay.tsx#L140

- **Prefer `Number.isFinite` over `isFinite`.**
  apps/geonexia/frontend/app/activity/index.tsx:235
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activity/index.tsx#L235

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
  apps/geonexia/frontend/helpers/h3/libh3.js:181
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L181

- **Use `Math.trunc` instead of `>> 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:184
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L184

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:193
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L193

- **Use `Math.trunc` instead of `~~`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:193
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L193

- **Use `Math.trunc` instead of `~~`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:193
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L193

- **Use `Math.trunc` instead of `>> 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:210
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L210

- **Use `Math.trunc` instead of `>> 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:212
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L212

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:305
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L305

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:310
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L310

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:320
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L320

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:323
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L323

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:337
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L337

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:339
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L339

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:579
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L579

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:598
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L598

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:600
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L600

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:603
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L603

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:622
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L622

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:669
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L669

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:670
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L670

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:707
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L707

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:710
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L710

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:712
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L712

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:715
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L715

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:718
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L718

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:722
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L722

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:723
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L723

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:727
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L727

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:728
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L728

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:732
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L732

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:734
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L734

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:736
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L736

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:737
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L737

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:738
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L738

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:740
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L740

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:741
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L741

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:741
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L741

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:741
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L741

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:742
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L742

- **Use `Math.trunc` instead of `| 0`.**
  apps/geonexia/frontend/helpers/h3/libh3.js:743
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/helpers/h3/libh3.js#L743

