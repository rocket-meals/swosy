# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 3 | 3 |
| 🐛 Reliability | 1 | 1 |
| 🔧 Maintainability | 50 | 46 |

**Total issues:** 54 (showing top 50 prioritized by: Security > Reliability > Maintainability)

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

## 🐛 Reliability (1/1)

- **Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking.**
  apps/frontend/app/constants/MarkdownPatterns.ts:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/constants/MarkdownPatterns.ts#L16

## 🔧 Maintainability (46/50)

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:91
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L91

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/course-timetable/index.tsx:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/course-timetable/index.tsx#L97

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/experimentell/expo-update-test/index.tsx:181
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/expo-update-test/index.tsx#L181

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx:148
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx#L148

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx:152
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/experimentell/game-ideas/index.tsx#L152

- **Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.**
  apps/frontend/app/app/(app)/foodoffers/details/components/FoodHeader.tsx:116
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/foodoffers/details/components/FoodHeader.tsx#L116

- **Prefer `node:buffer` over `buffer`.**
  apps/frontend/app/app/(app)/form-queue/index.tsx:20
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-queue/index.tsx#L20

- **Prefer `node:buffer` over `buffer`.**
  apps/frontend/app/app/(app)/form-submission/index.tsx:42
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submission/index.tsx#L42

- **Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.**
  apps/frontend/app/app/(app)/form-submissions/index.tsx:321
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/form-submissions/index.tsx#L321

- **Do not use Array index in keys**
  apps/frontend/app/app/(app)/map/index.tsx:1750
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(app)/map/index.tsx#L1750

- **Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.**
  apps/frontend/app/app/(monitor)/bigScreen/index.tsx:84
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/bigScreen/index.tsx#L84

- **The signature '(...text: string[]): void | undefined' of 'newWindow.document.write' is deprecated.**
  apps/frontend/app/app/(monitor)/list-week-screen/details/index.tsx:417
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/list-week-screen/details/index.tsx#L417

- **Do not use Array index in keys**
  apps/frontend/app/app/(monitor)/rss-feed-config/index.tsx:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/app/(monitor)/rss-feed-config/index.tsx#L31

- **Do not use Array index in keys**
  apps/frontend/app/components/DataAcces/DataAccess.tsx:25
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/DataAcces/DataAccess.tsx#L25

- **Do not use Array index in keys**
  apps/frontend/app/components/DataAcces/DataAccess.tsx:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/DataAcces/DataAccess.tsx#L31

- **Do not use Array index in keys**
  apps/frontend/app/components/DataAcces/DataAccess.tsx:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/DataAcces/DataAccess.tsx#L19

- **Move this component definition out of the parent component and pass data as props.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:324
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L324

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/frontend/app/components/MarkingLabels/MarkingLabels.tsx:235
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/MarkingLabels/MarkingLabels.tsx#L235

- **Do not use Array index in keys**
  apps/frontend/app/components/RateAppSettingsItem/RateAppSettingsItem.tsx:101
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/RateAppSettingsItem/RateAppSettingsItem.tsx#L101

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

- **'hexTilesEnclosed' is deprecated.**
  apps/geonexia/frontend/app/activities/[id].tsx:800
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/activities/[id].tsx#L800

- **Do not use Array index in keys**
  apps/geonexia/frontend/app/experimental/3d-kyle-test/index.tsx:415
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/experimental/3d-kyle-test/index.tsx#L415

- **Do not use Array index in keys**
  apps/geonexia/frontend/app/experimental/onboarding/index.tsx:402
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/experimental/onboarding/index.tsx#L402

- **Do not use Array index in keys**
  apps/geonexia/frontend/app/experimental/seaphara/index.tsx:416
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/experimental/seaphara/index.tsx#L416

- **Function 'announcePaceHintTransitionIfDue' has too many parameters (9). Maximum allowed is 7.**
  apps/geonexia/frontend/app/index.tsx:3789
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L3789

- **Do not use Array index in keys**
  apps/geonexia/frontend/app/index.tsx:1992
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L1992

- **Simplify this regular expression to reduce its complexity from 29 to the 20 allowed.**
  apps/geonexia/frontend/assets/objects/1_fix_viewbox.py:28
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/assets/objects/1_fix_viewbox.py#L28

- **'billboardAnchorColor' is deprecated.**
  apps/geonexia/frontend/store/hexTileSlice.ts:187
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/store/hexTileSlice.ts#L187

- **'billboardAnchorColor' is deprecated.**
  apps/geonexia/frontend/store/hexTileSlice.ts:205
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/store/hexTileSlice.ts#L205

- **The signature '(collection: CollectionNames): any' of 'CollectionHelper.getCollectionTypeAlias' is deprecated.**
  packages/common-backend/src/CollectionHelper.ts:35
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common-backend/src/CollectionHelper.ts#L35

