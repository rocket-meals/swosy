# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 0 | 0 |
| 🐛 Reliability | 22 | 22 |
| 🔧 Maintainability | 2225 | 28 |

**Total issues:** 2247 (showing top 50 prioritized by: Security > Reliability > Maintainability)

---

## 🐛 Reliability (22/22)

- **React Hook "useMyContrastColor" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?**
  apps/frontend/app/components/Details/AttributeItem.tsx:46
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/Details/AttributeItem.tsx#L46

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:482
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L482

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:481
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L481

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:480
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L480

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:483
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L483

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:484
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L484

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:485
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L485

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:488
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L488

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:490
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L490

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:491
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L491

- **React Hook "useAppSelector" is called conditionally. React Hooks must be called in the exact same order in every component render.**
  apps/frontend/app/components/FoodItem/FoodItem.tsx:517
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/FoodItem/FoodItem.tsx#L517

- **React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?**
  apps/frontend/app/components/MarkingLabels/MarkingLabels.tsx:102
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/MarkingLabels/MarkingLabels.tsx#L102

- **React Hook "useCallback" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?**
  apps/frontend/app/components/SettingsListMarkingLabel/SettingsListMarkingLabel.tsx:95
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/components/SettingsListMarkingLabel/SettingsListMarkingLabel.tsx#L95

- **React Hook "CommonDateHelper.useSmartReadableDate" cannot be called inside a callback. React Hooks must be called in a React function component or a custom React Hook function.**
  apps/frontend/app/helper/DateHelper.ts:20
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/DateHelper.ts#L20

- **Use `Math.trunc` instead of `| 0`.**
  apps/frontend/app/helper/hashHelper.ts:49
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L49

- **Prefer `String#codePointAt()` over `String#charCodeAt()`.**
  apps/frontend/app/helper/hashHelper.ts:56
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/hashHelper.ts#L56

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/generateIcons.sh:132
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/generateIcons.sh#L132

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  apps/frontend/generateIcons.sh:141
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/generateIcons.sh#L141

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  generate_basic_auth_traefik.sh:16
  https://github.com/rocket-meals/rocket-meals/blob/master/generate_basic_auth_traefik.sh#L16

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  generate_basic_auth_traefik.sh:46
  https://github.com/rocket-meals/rocket-meals/blob/master/generate_basic_auth_traefik.sh#L46

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  scripts/setup-weekly-update-cron.sh:22
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/setup-weekly-update-cron.sh#L22

- **Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich.**
  scripts/weekly-update.sh:15
  https://github.com/rocket-meals/rocket-meals/blob/master/scripts/weekly-update.sh#L15

## 🔧 Maintainability (28/2225)

- **Remove cache after installing packages or store it in a cache mount.**
  apps/backend-sync/Dockerfile:11
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/Dockerfile#L11

- **Merge this RUN instruction with the consecutive ones.**
  apps/backend-sync/Dockerfile:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/Dockerfile#L4

- **Remove cache after installing packages or store it in a cache mount.**
  apps/backend-sync/Dockerfile:4
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/Dockerfile#L4

- **Remove cache after installing packages or store it in a cache mount.**
  apps/backend-sync/Dockerfile:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/Dockerfile#L8

- **Move function 'base64UrlDecodeToString' to the outer scope.**
  apps/backend-sync/src/apple-secret-rotator/apple/generateAppleClientSecret.ts:34
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/apple/generateAppleClientSecret.ts#L34

- **Handle this exception or don't catch it at all.**
  apps/backend-sync/src/apple-secret-rotator/apple/generateAppleClientSecret.ts:48
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/apple/generateAppleClientSecret.ts#L48

- **Prefer `node:child_process` over `child_process`.**
  apps/backend-sync/src/apple-secret-rotator/apple/generateAppleClientSecretShell.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/apple/generateAppleClientSecretShell.ts#L2

- **`String.raw` should be used to avoid escaping `\`.**
  apps/backend-sync/src/apple-secret-rotator/index.ts:34
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/index.ts#L34

- **Unexpected `await` of a non-Promise (non-"Thenable") value.**
  apps/backend-sync/src/apple-secret-rotator/index.ts:92
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/index.ts#L92

- **Prefer `node:fs` over `fs`.**
  apps/backend-sync/src/apple-secret-rotator/index.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/apple-secret-rotator/index.ts#L1

- **Prefer `node:path` over `path`.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L2

- **Prefer `node:fs` over `fs`.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:3
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L3

- **Prefer `node:module` over `module`.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L8

- **`requiredModules` should be a `Set`, and use `requiredModules.has()` to check existence or non-existence.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:27
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L27

- **`collectionsToSkip` should be a `Set`, and use `collectionsToSkip.has()` to check existence or non-existence.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:28
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L28

- **Remove this commented out code.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:55
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L55

- **Remove this commented out code.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:64
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L64

- **Remove this commented out code.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:129
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L129

- **Unexpected negated condition.**
  apps/backend-sync/src/DirectusDatabaseSync.ts:216
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DirectusDatabaseSync.ts#L216

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/backend-sync/src/DockerContainerManager.ts:14
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerContainerManager.ts#L14

- **Handle this exception or don't catch it at all.**
  apps/backend-sync/src/DockerContainerManager.ts:129
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerContainerManager.ts#L129

- **Prefer `node:child_process` over `child_process`.**
  apps/backend-sync/src/DockerContainerManager.ts:1
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerContainerManager.ts#L1

- **Prefer `node:util` over `util`.**
  apps/backend-sync/src/DockerContainerManager.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerContainerManager.ts#L2

- **Make this public static property readonly.**
  apps/backend-sync/src/DockerContainerManager.ts:8
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerContainerManager.ts#L8

- **Make this public static property readonly.**
  apps/backend-sync/src/DockerDirectusHelper.ts:2
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerDirectusHelper.ts#L2

- **Remove this commented out code.**
  apps/backend-sync/src/DockerDirectusHelper.ts:7
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerDirectusHelper.ts#L7

- **Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed.**
  apps/backend-sync/src/DockerDirectusPingHelper.ts:6
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerDirectusPingHelper.ts#L6

- **Remove this commented out code.**
  apps/backend-sync/src/DockerDirectusPingHelper.ts:7
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend-sync/src/DockerDirectusPingHelper.ts#L7

