# scripts

## SonarCloud: Issues sortieren und gruppieren

Das frühere `count-sonar-maintainability-issues.js` wurde entfernt. Sein
Nachfolger liegt direkt neben den SonarCloud-Reports:

```bash
node reports/sonarCloud/sonar-sort-and-group.js [reliability|maintainability|security|all|<pfad.csv>] [--top N|all] [--details] [--json]
```

- Default ist `reliability` (Bugs), für das alte Verhalten `maintainability` angeben.
- Details zum Ablauf: `docs/SONARCLOUD_MAINTAINABILITY_WORKFLOW.md`.
