# 📊 SonarCloud Issues Report

## Summary

| Category | Total Issues | Shown |
|----------|-------------|-------|
| 🔒 Security | 3 | 3 |
| 🐛 Reliability | 0 | 0 |
| 🔧 Maintainability | 1 | 1 |

**Total issues:** 4

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

## 🔧 Maintainability (1/1)

- **Fix the syntax of this issue suppression comment.**
  apps/geonexia/frontend/assets/objects/1_fix_viewbox.py:28
  https://github.com/rocket-meals/rocket-meals/blob/master/apps/geonexia/frontend/assets/objects/1_fix_viewbox.py#L28

