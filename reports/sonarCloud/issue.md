# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 3 | 3 |
| 🐛 Reliability | 0 | 0 |
| 🔧 Maintainability | 6 | 6 |

**Total issues:** 9

---

## 🔒 Security (3/3)

- **Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation.**
  apps/backend/Dockerfile:36
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Dockerfile#L36

- **Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation.**
  apps/backend/Dockerfile:37
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Dockerfile#L37

- **LLMs running this code with faulty CLI arguments can escape file system restrictions. Refactor this code to validate the constructed path before accessing the file system.**
  scripts/count-sonar-maintainability-issues.js:93
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/count-sonar-maintainability-issues.js#L93

## 🔧 Maintainability (6/6)

- **Async arrow function has too many parameters (8). Maximum allowed is 7.**
  apps/frontend/app/app/(monitor)/bigScreen/index.tsx:193
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/bigScreen/index.tsx#L193

- **Move this component definition out of the parent component and pass data as props.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:324
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L324

- **Prefer `structuredClone(…)` over `JSON.parse(JSON.stringify(…))` to create a deep clone.**
  apps/frontend/app/helper/animationHelper.ts:175
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/animationHelper.ts#L175

- **Simplify this regular expression to reduce its complexity from 30 to the 20 allowed.**
  apps/geonexia/frontend/assets/objects/1_fix_viewbox.py:28
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/assets/objects/1_fix_viewbox.py#L28

- **Use `export…from` to re-export `MyBuffer`.**
  packages/common-ui/src/helpers/MyBuffer.ts:10
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common-ui/src/helpers/MyBuffer.ts#L10

- **Use 'Object.hasOwn()' instead of 'Object.prototype.hasOwnProperty.call()'.**
  packages/common/src/DateHelper.ts:414
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/DateHelper.ts#L414

