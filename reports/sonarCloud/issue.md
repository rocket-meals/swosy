# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 4 | 4 |
| 🐛 Reliability | 1 | 1 |
| 🔧 Maintainability | 30 | 30 |

**Total issues:** 35

---

## 🔒 Security (4/4)

- **Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation.**
  apps/backend/Dockerfile:36
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Dockerfile#L36

- **Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation.**
  apps/backend/Dockerfile:37
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Dockerfile#L37

- **Make sure that using this pseudorandom number generator is safe here.**
  apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx:51
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx#L51

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  scripts/count-sonar-maintainability-issues.js:93
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/count-sonar-maintainability-issues.js#L93

## 🐛 Reliability (1/1)

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/constants/MarkdownPatterns.ts:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/constants/MarkdownPatterns.ts#L16

## 🔧 Maintainability (30/30)

- **Move this array "sort" operation to a separate statement or replace it with "toSorted".**
  apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx:51
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx#L51

- **Prefer `node:buffer` over `buffer`.**
  apps/frontend/app/app/(app)/form-queue/index.tsx:20
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-queue/index.tsx#L20

- **Prefer `node:buffer` over `buffer`.**
  apps/frontend/app/app/(app)/form-submission/index.tsx:42
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submission/index.tsx#L42

- **Provide multiple methods instead of using "append" to determine which action to take.**
  apps/frontend/app/app/(app)/form-submissions/index.tsx:329
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submissions/index.tsx#L329

- **Provide multiple methods instead of using "isConnected" to determine which action to take.**
  apps/frontend/app/app/(monitor)/bigScreen/index.tsx:94
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/bigScreen/index.tsx#L94

- **'any' overrides all other types in this union type.**
  apps/frontend/app/app/(monitor)/bigScreen/index.tsx:102
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/bigScreen/index.tsx#L102

- **Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.**
  apps/frontend/app/app/(monitor)/bigScreen/index.tsx:129
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/bigScreen/index.tsx#L129

- **The signature '(...text: string[]): void | undefined' of 'newWindow.document.write' is deprecated.**
  apps/frontend/app/app/(monitor)/list-week-screen/details/index.tsx:417
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/list-week-screen/details/index.tsx#L417

- **Move this component definition out of the parent component and pass data as props.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:324
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L324

- **Prefer `structuredClone(…)` over `JSON.parse(JSON.stringify(…))` to create a deep clone.**
  apps/frontend/app/helper/animationHelper.ts:175
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/animationHelper.ts#L175

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:93
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L93

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L97

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:101
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L101

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:105
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L105

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:109
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L109

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:113
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L113

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L117

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:121
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L121

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:125
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L125

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:129
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L129

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:133
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L133

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:137
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L137

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:141
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L141

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:145
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L145

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:149
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L149

- **Arguments 'c' and 'a' have the same names but not the same order as the function parameters.**
  apps/frontend/app/helper/hashHelper.ts:153
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L153

- **Simplify this regular expression to reduce its complexity from 29 to the 20 allowed.**
  apps/geonexia/frontend/assets/objects/1_fix_viewbox.py:28
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/assets/objects/1_fix_viewbox.py#L28

- **The signature '(collection: CollectionNames): any' of 'CollectionHelper.getCollectionTypeAlias' is deprecated.**
  packages/common-backend/src/CollectionHelper.ts:35
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common-backend/src/CollectionHelper.ts#L35

- **The signature '(collection: CollectionNames): any' of 'CollectionHelper.getCollectionPropertyDetails' is deprecated.**
  packages/common-backend/src/CollectionHelper.ts:60
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common-backend/src/CollectionHelper.ts#L60

- **Use 'Object.hasOwn()' instead of 'Object.prototype.hasOwnProperty.call()'.**
  packages/common/src/DateHelper.ts:414
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/DateHelper.ts#L414

