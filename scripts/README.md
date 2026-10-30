# scripts

## SonarCloud: Issues sortieren und gruppieren

Das frühere `count-sonar-maintainability-issues.js` wurde entfernt. Sein
Nachfolger liegt direkt neben den SonarCloud-Reports:

```bash
node reports/sonarCloud/sonar-sort-and-group.js [reliability|maintainability|security|all|<pfad.csv>] [--top N|all] [--details] [--json]
```

- Default ist `reliability` (Bugs), für das alte Verhalten `maintainability` angeben.
- Details zum Ablauf: `docs/SONARCLOUD_MAINTAINABILITY_WORKFLOW.md`.

## iOS-Credentials erneuern (Distribution Certificate)

Apple-Distribution-Zertifikate laufen nach einem Jahr ab. `eas build --non-interactive`
in der CI kann kein neues anlegen, das passiert einmal im Jahr von Hand:

```bash
yarn ios-credentials:rocket-meals   # bzw. :geonexia, :score-tracker, :tag-und-jahr
```

`eas-ios-credentials.sh` prüft, ob man bei Expo eingeloggt ist (sonst `eas login`),
und öffnet dann `eas credentials` für die App. Ist eas-cli nicht installiert,
läuft es über `npx eas-cli@latest`.

Im Menü: Profil **production** → **Build Credentials** → **Distribution Certificate**
→ neues Zertifikat erzeugen. Das Zertifikat gilt für das ganze Apple-Team, die
anderen Apps danach mit ihrem eigenen Befehl auf das neue, schon vorhandene
Zertifikat umstellen. Das Provisioning Profile erzeugt der nächste CI-Build selbst.
