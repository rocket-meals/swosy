# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 0 | 0 |
| 🐛 Reliability | 0 | 0 |
| 🔧 Maintainability | 2081 | 50 |

**Total issues:** 2081 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🔧 Maintainability (50/2081)

- **Remove this useless assignment to variable "translatorSettings".**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:280
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L280

- **Unexpected negated condition.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts:60
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts#L60

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts:51
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/cashregister-hook/ParseSchedule.ts#L51

- **Extract this nested ternary operation into an independent statement.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts:49
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts#L49

- **Unexpected negated condition.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts:64
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-hook/index.ts#L64

- **Extract this nested ternary operation into an independent statement.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:38
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L38

- **This assertion is unnecessary since it does not change the type of the expression.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts:135
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collectible-events-repeat-hook/index.ts#L135

- **`excludeCollections` should be a `Set`, and use `excludeCollections.has()` to check existence or non-existence.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts:12
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts#L12

- **Remove this unused import of 'defineHook'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts#L1

- **Handle this exception or don't catch it at all.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts:79
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts#L79

- **Complete the task associated to this "TODO" comment.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts:80
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/collections-last-update-hook/index.ts#L80

- **Remove this unused import of 'CronObject'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L11

- **'repo-depkit-common' imported multiple times.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L11

- **Refactor this function to reduce its Cognitive Complexity from 142 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:49
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L49

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:52
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L52

- **'repo-depkit-common' imported multiple times.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:6
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L6

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:54
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L54

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:69
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L69

- **Unexpected negated condition.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:69
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L69

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:93
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L93

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:100
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L100

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:115
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L115

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:153
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L153

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:173
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L173

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:175
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L175

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:177
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L177

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts:246
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/file-cleanup-hook/index.ts#L246

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts:6
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts#L6

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts:7
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts#L7

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts:65
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts#L65

- **Handle this exception or don't catch it at all.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts:94
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts#L94

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts:101
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts#L101

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts:110
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/FoodRatingCalculator.ts#L110

- **Remove this unused import of 'DatabaseInitializedCheck'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts:3
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts#L3

- **Remove this unused import of 'defineHook'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-rating-calculate-hook/index.ts#L1

- **Remove this unused import of 'DatabaseInitializedCheck'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:3
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L3

- **Remove this useless assignment to variable "pre".**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:15
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L15

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L16

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:32
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L32

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:35
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L35

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:37
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L37

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:45
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L45

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L50

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:56
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L56

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:34
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L34

- **Remove this unused import of 'defineHook'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L1

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts:58
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/index.ts#L58

- **Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/ReportGenerator.ts:248
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/ReportGenerator.ts#L248

- **Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/ReportGenerator.ts:403
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/ReportGenerator.ts#L403

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/ReportGenerator.ts:12
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/food-feedback-report-schedule/ReportGenerator.ts#L12

