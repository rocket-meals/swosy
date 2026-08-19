# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 0 | 0 |
| 🐛 Reliability | 0 | 0 |
| 🔧 Maintainability | 4 | 4 |

**Total issues:** 4

---

## 🔧 Maintainability (4/4)

- **Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read.**
  apps/frontend/app/helper/AppUsageEventHelper.ts:84
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/AppUsageEventHelper.ts#L84

- **The empty object is useless.**
  apps/frontend/app/helper/AppUsageEventHelper.ts:113
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/frontend/app/helper/AppUsageEventHelper.ts#L113

- **Move this component definition out of the parent component and pass data as props.**
  apps/tag-und-jahr/frontend/app/_layout.tsx:31
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/tag-und-jahr/frontend/app/_layout.tsx#L31

- **Use `export…from` to re-export `FALLBACK_TRANSLATION_LANGUAGE`.**
  packages/common/src/translations/TranslationHelper.ts:206
  https://github.com/rocket-meals/rocket-meals/blob/master/packages/common/src/translations/TranslationHelper.ts#L206

