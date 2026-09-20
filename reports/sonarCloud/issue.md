# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 1 | 1 |
| 🐛 Reliability | 30 | 30 |
| 🔧 Maintainability | 271 | 19 |

**Total issues:** 302 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔒 Security (1/1)

- **Code Injection via unsanitized user input**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:10
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L10

## 🐛 Reliability (30/30)

- **Prefer `String#replaceAll()` over `String#split().join()`.**
  apps/frontend/app/helper/housingAnalytics/HousingAnalyticsCsv.ts:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/housingAnalytics/HousingAnalyticsCsv.ts#L50

- **Do not use "SharedArrayBuffer" to declare a variable - use another name.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L2

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:3
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L3

- **Use `new Error()` instead of `Error()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L4

- **Expected the Promise rejection reason to be an Error.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L4

- **Either remove this useless object instantiation of "Uint16Array" or use it.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L8

- **Either remove this useless object instantiation of "BigUint64Array" or use it.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L8

- **Review this usage of "c" as it can only be empty here.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L19

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:24
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L24

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:24
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L24

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:24
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L24

- **Prefer `String.fromCodePoint()` over `String.fromCharCode()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:25
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L25

- **Introduce a new variable or use its initial value before reassigning "d".**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:28
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L28

- **Prefer `Number.NaN` over `NaN`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:29
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L29

- **Use `Math.trunc` instead of `| 0`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:29
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L29

- **Prefer `Number.NaN` over `NaN`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L31

- **Use `Math.trunc` instead of `| 0`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L31

- **Was "-=" meant instead?**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L31

- **Use `Math.trunc` instead of `| 0`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:32
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L32

- **Use `Math.trunc` instead of `| 0`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:33
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L33

- **Prefer `Number.isNaN` over `isNaN`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:34
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L34

- **Expected an assignment or function call and instead saw an expression.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:35
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L35

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:39
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L39

- **Use `new Error()` instead of `Error()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:40
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L40

- **Use `Math.trunc` instead of `| 0`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:41
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L41

- **Use `new Error()` instead of `Error()`.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:42
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L42

- **Expected an assignment or function call and instead saw an expression.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:58
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L58

- **Expected an assignment or function call and instead saw an expression.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:58
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L58

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  packages/common/src/FoodofferPriceHelper.ts:227
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/FoodofferPriceHelper.ts#L227

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  packages/common/src/form/IbanValidationHelper.ts:124
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/form/IbanValidationHelper.ts#L124

## 🔧 Maintainability (19/271)

- **Move function 'getDashboardIdOfPanelPayload' to the outer scope.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts:172
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts#L172

- **Move function 'isProtectionActiveFor' to the outer scope.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts:63
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts#L63

- **Move function 'buildForbiddenError' to the outer scope.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts:67
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook/index.ts#L67

- **Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.**
  apps/frontend/app/app/(app)/housing-analytics/[report].tsx:64
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/housing-analytics/[report].tsx#L64

- **Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.**
  apps/frontend/app/components/OcrCamera/index.tsx:73
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/OcrCamera/index.tsx#L73

- **Compare with `undefined` directly instead of using `typeof`.**
  apps/frontend/app/helper/appStateForFeedback.ts:98
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/appStateForFeedback.ts#L98

- **'value' may use Object's default stringification format ('[object Object]') when stringified.**
  apps/frontend/app/helper/appStateForFeedback.ts:103
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/appStateForFeedback.ts#L103

- **Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read.**
  apps/frontend/app/helper/AppUsageEventHelper.ts:84
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/AppUsageEventHelper.ts#L84

- **The empty object is useless.**
  apps/frontend/app/helper/AppUsageEventHelper.ts:113
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/AppUsageEventHelper.ts#L113

- **Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`.**
  apps/frontend/app/helper/downloadTextFileOnWeb.ts:14
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/downloadTextFileOnWeb.ts#L14

- **Prefer `String#replaceAll()` over `String#split().join()`.**
  apps/frontend/app/helper/housingAnalytics/HousingAnalyticsCsv.ts:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/housingAnalytics/HousingAnalyticsCsv.ts#L50

- **Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.**
  apps/frontend/app/helper/housingAnalytics/HousingAnalyticsReports.ts:451
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/housingAnalytics/HousingAnalyticsReports.ts#L451

- **`String.raw` should be used to avoid escaping `\`.**
  apps/frontend/app/helper/housingAnalytics/HousingHandoverRecords.ts:121
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/housingAnalytics/HousingHandoverRecords.ts#L121

- **Do not call `Array#push()` multiple times.**
  apps/frontend/app/hooks/useOcr.tsx:198
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/hooks/useOcr.tsx#L198

- **Extract this nested ternary operation into an independent statement.**
  apps/frontend/app/hooks/useOcr.tsx:211
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/hooks/useOcr.tsx#L211

- **Extract this nested ternary operation into an independent statement.**
  apps/frontend/app/hooks/useOcr.tsx:211
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/hooks/useOcr.tsx#L211

- **Prefer `node:path` over `path`.**
  apps/frontend/app/metro.config.js:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/metro.config.js#L1

- **Extract the assignment of "k" from this expression.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L1

- **Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.**
  apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/public/paddleocr/ort-wasm-simd-threaded.mjs#L1

