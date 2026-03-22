# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 0 | 0 |
| 🐛 Reliability | 2 | 2 |
| 🔧 Maintainability | 2208 | 48 |

**Total issues:** 2210 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🐛 Reliability (2/2)

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/hooks/useLanguage.ts:68
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/hooks/useLanguage.ts#L68

- **Prefer `String#replaceAll()` over `String#replace()`.**
  apps/frontend/app/hooks/useLanguage.ts:77
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/hooks/useLanguage.ts#L77

## 🔧 Maintainability (48/2208)

- **Sort these package names alphanumerically.**
  apps/backend-sync/Dockerfile:5
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/Dockerfile#L5

- **Merge this RUN instruction with the consecutive ones.**
  apps/backend-sync/Dockerfile:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/Dockerfile#L4

- **Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.**
  apps/backend-sync/src/DockerDirectusPingHelper.ts:6
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerDirectusPingHelper.ts#L6

- **Remove this commented out code.**
  apps/backend-sync/src/DockerDirectusPingHelper.ts:7
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerDirectusPingHelper.ts#L7

- **Prefer `node:path` over `path`.**
  apps/backend-sync/src/EnvFileFinder.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/EnvFileFinder.ts#L1

- **Prefer `node:fs` over `fs`.**
  apps/backend-sync/src/EnvFileFinder.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/EnvFileFinder.ts#L2

- **Prefer `node:https` over `https`.**
  apps/backend-sync/src/FetchIgnoreSelfSignedCertHelper.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/FetchIgnoreSelfSignedCertHelper.ts#L1

- **Remove this useless assignment to variable "result".**
  apps/backend-sync/src/index.ts:14
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/index.ts#L14

- **Remove this useless assignment to variable "result".**
  apps/backend-sync/src/index.ts:27
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/index.ts#L27

- **Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.**
  apps/backend-sync/src/SyncDatabaseSchema.ts:32
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/SyncDatabaseSchema.ts#L32

- **Prefer `node:path` over `path`.**
  apps/backend-sync/src/SyncDatabaseSchema.ts:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/SyncDatabaseSchema.ts#L4

- **This always evaluates to truthy. Consider refactoring this code.**
  apps/backend-sync/src/SyncDatabaseSchema.ts:71
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/SyncDatabaseSchema.ts#L71

- **Remove this unused import of 'DatabaseInitializedCheck'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts#L2

- **Remove this unused import of 'defineHook'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts#L1

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts:21
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/activity-auto-cleanup-schedule/index.ts#L21

- **Remove this unused import of 'DatabaseInitializedCheck'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts#L2

- **Remove this unused import of 'defineHook'.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts#L1

- **Complete the task associated to this "TODO" comment.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts:40
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/app-feedbacks-hook/index.ts#L40

- **`String.raw` should be used to avoid escaping `\`.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts:62
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts#L62

- **`String.raw` should be used to avoid escaping `\`.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts:62
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts#L62

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts:43
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts#L43

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts:80
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts#L80

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts:114
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts#L114

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts:117
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts#L117

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts:204
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DeepLTranslator.ts#L204

- **Remove this useless assignment to variable "schema".**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:43
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L43

- **Remove this useless assignment to variable "collectionName".**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:43
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L43

- **Remove this useless assignment to variable "translation_field".**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:43
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L43

- **Expected a `for-of` loop instead of a `for` loop with this simple iteration.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:56
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L56

- **Refactor this function to reduce its Cognitive Complexity from 71 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:97
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L97

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:392
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L392

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:15
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L15

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:16
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L16

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:18
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L18

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:19
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L19

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:256
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L256

- **Unexpected negated condition.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:256
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L256

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:298
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L298

- **Unexpected negated condition.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:298
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L298

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:348
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L348

- **Unexpected negated condition.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:348
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L348

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:20
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L20

- **Make this public static property readonly.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:22
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L22

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:90
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L90

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:186
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L186

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:233
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L233

- **Remove this commented out code.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:30
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L30

- **Redundant double negation.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts:47
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/auto-translation-hook/DirectusCollectionTranslator.ts#L47

