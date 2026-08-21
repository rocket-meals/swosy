# Dashboards (Insights) - System-Dashboards vs. eigene Dashboards

## Warum

Bei jedem Start des Containers `rocket-meals-database-sync` wird der Dashboard-Stand aus dem
Repository (`data/directus-sync-data/configuration/directus-config/collections/dashboards.json`) per
`directus-sync push` eingespielt. Änderungen, die jemand auf einem Kundenserver an einem
ausgelieferten Dashboard vornimmt, sind danach wieder weg.

Damit niemand Arbeit in ein Dashboard steckt, das beim nächsten Update ohnehin zurückgesetzt wird,
sind ausgelieferte Dashboards auf Kundenservern schreibgeschützt.

## Wie ein Dashboard gekennzeichnet ist

Am Marker im Namen: ausgelieferte Dashboards tragen `[System]`, jedes andere Dashboard den Schlüssel
des Servers, auf dem es angelegt wurde - also z. B. `Mensen [System]` und
`Auswertung Mensa [Osnabrück]`.

Eckige Klammern statt runder, weil Directus beim Duplizieren selbst ein `(copy)` an den Namen hängt:
`Mensen [System] (copy)` bleibt so eindeutig lesbar. Aus demselben Grund wird der Marker überall im
Namen gesucht und nicht nur am Ende - eine Kopie eines System-Dashboards muss als solche erkannt
werden, damit der Hook aus ihr ein Dashboard des Servers machen kann.

Single source of truth ist `DashboardNameHelper` in `packages/common/src/DashboardNameHelper.ts`:

| Member                                                               | Bedeutung                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| `SYSTEM_NAME_KEY` / `SYSTEM_NAME_MARKER`                             | Der Schlüssel `System` und der daraus gebaute Marker |
| `buildNameMarker(key)`                                               | Baut den Marker für einen beliebigen Schlüssel       |
| `hasNameMarker` / `withNameMarker` / `withoutNameMarker`             | Prüfen, Ergänzen (idempotent), Entfernen             |
| `isSystemDashboardName` / `withSystemMarker` / `withoutSystemMarker` | Dasselbe, fest auf den Schlüssel `System`            |

Panels haben keinen eigenen Marker - sie sind geschützt, wenn das Dashboard, zu dem sie gehören, ein
System-Dashboard ist.

## Was der Hook macht

`Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook`

- `dashboards.update` / `dashboards.delete`: **HTTP 403**, wenn ein betroffenes Dashboard ein
  System-Dashboard ist.
- `panels.create` / `panels.update` / `panels.delete`: **HTTP 403**, wenn das Panel zu einem
  System-Dashboard gehört oder in eines verschoben werden soll.
- `dashboards.create` durch den **ADMIN_EMAIL**-User: der `[System]`-Marker wird ergänzt, falls er
  fehlt - neue ausgelieferte Dashboards sind damit von Anfang an gekennzeichnet.
- `dashboards.create` durch alle anderen Nutzer: ein selbst gesetzter `[System]`-Marker wird
  entfernt (sonst würde sich der Besitzer aus seinem eigenen Dashboard aussperren) und stattdessen
  der Schlüssel dieses Servers gesetzt, z. B. `[Osnabrück]` oder `[Test]`.
- `dashboards.update`: ein System-Dashboard behält seinen `[System]`-Marker auch beim Umbenennen -
  das gilt ebenso für den ADMIN_EMAIL-User, denn ein ausgeliefertes Dashboard soll nicht
  versehentlich so aussehen, als dürfte man es bearbeiten, obwohl der Deploy es weiterhin
  zurücksetzt. Jedes andere Dashboard behält beim Umbenennen den Schlüssel dieses Servers.

Die Fehlermeldungen stehen als Keys `dashboard_system_edit_forbidden` und
`dashboard_system_panel_edit_forbidden` im Übersetzungskatalog
(`helpers/translations/backendTranslations.ts`) und werden in der Sprache des Nutzers
(`profiles.language`) gerendert. Der Marker wird als `{{marker}}` eingesetzt, damit auch die Texte
den `SystemDashboardHelper` als einzige Quelle nutzen.

### Wer darf was

| Instanz      | ADMIN_EMAIL-User | Andere Nutzer                                  |
| ------------ | ---------------- | ---------------------------------------------- |
| Testsystem   | alles            | alles, im Rahmen ihrer Directus-Rechte         |
| Kundenserver | alles            | nur eigene Dashboards, keine System-Dashboards |

Gemeint ist ausdrücklich der Benutzer aus der Umgebungsvariable `ADMIN_EMAIL`, nicht jeder Nutzer
mit Administrator-Rolle. Dieser Bypass ist auch technisch notwendig: Der Deploy-Sync meldet sich mit
genau diesem Account an - würde er blockiert, würde jeder Container-Start am Push scheitern. Interne
Aufrufe ohne Accountability (z. B. andere Hooks) sind ebenfalls ausgenommen.

Das Testsystem erkennt der Hook an `SYNC_FOR_CUSTOMER=Test` (`SyncForCustomerEnum.TEST`), so wie
auch `news-sync-hook`, `housing-sync-hook`, `cashregister-hook` und `washingmachines-sync-hook` ihre
Datenquelle bestimmen. Jede andere Instanz gilt als Kundenserver - eine fehlende oder unbekannte
Angabe schützt also, statt den Schutz stillschweigend abzuschalten.

## Ein neues System-Dashboard ausliefern

1. Auf dem Testsystem als `ADMIN_EMAIL`-User anlegen (der Marker wird automatisch ergänzt).
2. `yarn workspace backend-sync sync:pull-from-test-system`
3. Änderungen an `data/directus-sync-data` committen und ausrollen.
