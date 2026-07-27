# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 0 | 0 |
| 🐛 Reliability | 2 | 2 |
| 🔧 Maintainability | 24 | 24 |

**Total issues:** 26

---

## 🐛 Reliability (2/2)

- **React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?**
  apps/score-tracker/frontend/components/GameImagePicker.tsx:186
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameImagePicker.tsx#L186

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/score-tracker/frontend/helpers/ImageSearch.ts:168
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/ImageSearch.ts#L168

## 🔧 Maintainability (24/24)

- **Extract this nested ternary operation into an independent statement.**
  apps/frontend/app/components/Login/LoginDebugPanel.tsx:63
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/Login/LoginDebugPanel.tsx#L63

- **Do not use Array index in keys**
  apps/frontend/app/components/Login/LoginDebugPanel.tsx:74
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/Login/LoginDebugPanel.tsx#L74

- **Refactor this code to not use nested template literals.**
  apps/frontend/app/helper/authHelper.ts:267
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/authHelper.ts#L267

- **Remove this unused import of 'GameType'.**
  apps/score-tracker/frontend/app/games/[id].tsx:39
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L39

- **Remove this unused import of 'setGameTypeIcon'.**
  apps/score-tracker/frontend/app/games/[id].tsx:21
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L21

- **Refactor this code to not use nested template literals.**
  apps/score-tracker/frontend/app/games/[id].tsx:84
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/games/[id].tsx#L84

- **Refactor this code to not nest functions more than 4 levels deep.**
  apps/score-tracker/frontend/app/index.tsx:609
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L609

- **Remove this unused import of 'resetAll'.**
  apps/score-tracker/frontend/app/index.tsx:46
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L46

- **Remove this unused import of 'archiveGame'.**
  apps/score-tracker/frontend/app/index.tsx:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L50

- **Remove this unused import of 'buildHistoryEntry'.**
  apps/score-tracker/frontend/app/index.tsx:56
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L56

- **Remove this unused import of 'generateId'.**
  apps/score-tracker/frontend/app/index.tsx:60
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L60

- **Remove this useless assignment to variable "game".**
  apps/score-tracker/frontend/app/index.tsx:981
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L981

- **Remove this useless assignment to variable "friends".**
  apps/score-tracker/frontend/app/index.tsx:987
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L987

- **Remove this useless assignment to variable "toggleEditingPlayers".**
  apps/score-tracker/frontend/app/index.tsx:1005
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L1005

- **Remove this useless assignment to variable "categoryValues".**
  apps/score-tracker/frontend/app/index.tsx:991
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/app/index.tsx#L991

- **Extract this nested ternary operation into an independent statement.**
  apps/score-tracker/frontend/components/GameCategorySettings.tsx:209
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameCategorySettings.tsx#L209

- **'../helpers/GameImageUpload' imported multiple times.**
  apps/score-tracker/frontend/components/GameImagePicker.tsx:21
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameImagePicker.tsx#L21

- **'../helpers/GameImageUpload' imported multiple times.**
  apps/score-tracker/frontend/components/GameImagePicker.tsx:23
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameImagePicker.tsx#L23

- **Use `export…from` to re-export `defaultImageQuery`.**
  apps/score-tracker/frontend/components/GameImagePicker.tsx:338
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/components/GameImagePicker.tsx#L338

- **The empty object is useless.**
  apps/score-tracker/frontend/helpers/GameCategories.ts:219
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/GameCategories.ts#L219

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/score-tracker/frontend/helpers/GameRules.ts:446
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/helpers/GameRules.ts#L446

- **Remove this unused import of 'Round'.**
  apps/score-tracker/frontend/store/gameSlice.ts:3
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/gameSlice.ts#L3

- **Remove this unused import of 'GameStatus'.**
  apps/score-tracker/frontend/store/gameSlice.ts:3
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/gameSlice.ts#L3

- **Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read.**
  apps/score-tracker/frontend/store/gameTypesSlice.ts:269
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/score-tracker/frontend/store/gameTypesSlice.ts#L269

