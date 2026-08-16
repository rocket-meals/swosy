# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 5 | 5 |
| 🐛 Reliability | 0 | 0 |
| 🔧 Maintainability | 4 | 4 |

**Total issues:** 9

---

## 🔒 Security (5/5)

- **Lifecycle scripts are enabled by default in Yarn v2+.**
  .github/workflows/backend-schema-sync-pull.yml:55
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/backend-schema-sync-pull.yml#L55

- **Make sure that no untrusted code is executed from a fork.**
  .github/workflows/ios-submit-review-geonexia.yml:43
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-geonexia.yml#L43

- **Make sure that no untrusted code is executed from a fork.**
  .github/workflows/ios-submit-review-rocket-meals.yml:39
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-rocket-meals.yml#L39

- **Make sure that no untrusted code is executed from a fork.**
  .github/workflows/ios-submit-review-score-tracker.yml:43
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-score-tracker.yml#L43

- **Make sure that no untrusted code is executed from a fork.**
  .github/workflows/ios-submit-review-tag-und-jahr.yml:43
  https://github.com/rocket-meals/rocket-meals/blob/master/.github/workflows/ios-submit-review-tag-und-jahr.yml#L43

## 🔧 Maintainability (4/4)

- **Refactor this function to not always return the same value.**
  apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/files-without-folder-report-schedule/index.ts:30
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/files-without-folder-report-schedule/index.ts#L30

- **useState call is not destructured into value + setter pair**
  apps/geonexia/frontend/app/index.tsx:4401
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/app/index.tsx#L4401

- **Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.**
  apps/tag-und-jahr/frontend/app/settings/index.tsx:50
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/tag-und-jahr/frontend/app/settings/index.tsx#L50

- **Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.**
  packages/common-ui/src/components/MyMap/index.web.tsx:105
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common-ui/src/components/MyMap/index.web.tsx#L105

