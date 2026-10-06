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

Alle Regeln gelten auf **jeder** Instanz, das Testsystem eingeschlossen. Ausgenommen ist nur der
ADMIN_EMAIL-User.

- `dashboards.update`: **HTTP 403**, wenn ein betroffenes Dashboard ein System-Dashboard ist - egal
  ob Name, Farbe, Icon oder Notiz geändert werden.
- `dashboards.delete`: **HTTP 403**. Ein gelöschtes System-Dashboard käme mit dem nächsten Deploy
  ohnehin zurück, nimmt auf dem Weg dorthin aber die Panels aller anderen mit.
- `panels.create` / `panels.update` / `panels.delete`: **HTTP 403**, wenn das Panel zu einem
  System-Dashboard gehört oder in eines verschoben werden soll. Damit sind auch Umbenennen und
  Verschieben von Panels eines System-Dashboards gesperrt.
- `dashboards.create` durch den **ADMIN_EMAIL**-User: der Name bekommt den `[System]`-Marker, jeder
  vorhandene Server-Marker wird vorher entfernt. Dupliziert der Admin `App [Test]`, macht Directus
  daraus `App [Test] (copy)` und der Hook `App (copy) [System]`.
- `dashboards.create` durch alle anderen Nutzer: analog mit dem Schlüssel dieses Servers, z. B.
  `App (copy) [Osnabrück]`. Ein `[System]` im Namen wird hier nur entfernt und nicht abgelehnt -
  genau so sieht der Name aus, wenn jemand ein System-Dashboard dupliziert, und das ist ein
  legitimer Weg zu einem eigenen Dashboard.
- `dashboards.update` durch den **ADMIN_EMAIL**-User: was er umbenennt, wird zum System-Dashboard.
  `App [Test]` lässt sich damit in `App [System]` umbenennen, und es bleibt nie der Schlüssel eines
  Servers stehen.
- `dashboards.update` durch alle anderen: System-Dashboards sind ohnehin gesperrt (siehe oben). Wer
  ein eigenes Dashboard in ein System-Dashboard umbenennen will, bekommt **HTTP 403** mit einer
  Erklärung - der Marker wird also nicht stillschweigend entfernt.

Die Fehlermeldungen stehen als Keys `dashboard_system_edit_forbidden`,
`dashboard_system_panel_edit_forbidden`, `dashboard_system_delete_forbidden` und
`dashboard_system_marker_forbidden` im Übersetzungskatalog
(`helpers/translations/backendTranslations.ts`) und werden in der Sprache des Nutzers
(`profiles.language`) gerendert. Der Marker wird als `{{marker}}` eingesetzt, damit auch die Texte
den `DashboardNameHelper` als einzige Quelle nutzen.

### Wer darf was

| Instanz                     | ADMIN_EMAIL-User | Andere Nutzer                                                   |
| --------------------------- | ---------------- | --------------------------------------------------------------- |
| Testsystem und Kundenserver | alles            | nur eigene Dashboards und deren Panels, keine System-Dashboards |

Gemeint ist ausdrücklich der Benutzer aus der Umgebungsvariable `ADMIN_EMAIL`, nicht jeder Nutzer
mit Administrator-Rolle. Dieser Bypass ist auch technisch notwendig: Der Deploy-Sync meldet sich mit
genau diesem Account an - würde er blockiert, würde jeder Container-Start am Push scheitern. Interne
Aufrufe ohne Accountability (z. B. andere Hooks) sind ebenfalls ausgenommen.

Der Schlüssel dieses Servers kommt aus `SYNC_FOR_CUSTOMER` (`SyncForCustomerEnum`), so wie auch
`news-sync-hook`, `housing-sync-hook`, `cashregister-hook` und `washingmachines-sync-hook` ihre
Datenquelle bestimmen. Er entscheidet nur über die Kennzeichnung neuer Dashboards, nicht über den
Schutz: Ist er nicht gesetzt, bleibt ein neues Dashboard ohne Marker, geschützt sind
System-Dashboards trotzdem.

## Ein neues System-Dashboard ausliefern

1. Auf dem Testsystem als `ADMIN_EMAIL`-User anlegen (der Marker wird automatisch ergänzt).
2. `yarn workspace backend-sync sync:pull-from-test-system`
3. Änderungen an `data/directus-sync-data` committen und ausrollen.

## Eigene Panels: `[Erweitert]`

Die eingebauten Panels von Directus (Liste, Metrik, Diagramme, …) sind Teil der Directus-App und
lassen sich nicht erweitern. Wo Kunden mehr brauchen, liefern wir eigene Panels im Bundle aus. Sie
tragen den Marker `[Erweitert]` im Namen, damit man sie in der Panel-Auswahl sofort von den
eingebauten unterscheiden kann - genau wie `[System]` bei Dashboards. Single source of truth für den
Marker ist `ExtendedPanelHelper` in
`Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/extended-panels/`.

| Panel                           | Quelle                    | Was es kann                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Liste [Erweitert]`             | `src/list-extended-panel` | Wie das eingebaute Listen-Panel (gleiche Optionen, Dashboard-Variablen, Auto-Aktualisierung, Schnellbearbeitung) plus Download-Button im Panel-Header neben dem Titel (bei ausgeblendetem Titel oben rechts im Panel): CSV (mit BOM, damit Excel Umlaute korrekt zeigt), JSON, XML, YAML. Standardmäßig alle Einträge, die zum Filter passen - nicht nur das Limit. Optional andere Felder für den Export. |
| `Seite exportieren [Erweitert]` | `src/page-export-panel`   | Button „Diese Seite exportieren": lädt das gesamte Dashboard als PDF (A4 quer, bei langen Dashboards mehrseitig) oder als PNG herunter. Das Panel selbst taucht im Export nicht auf.                                                                                                                                                                                                                       |

Hinweise:

- Der Export läuft über die normale REST-API (`?export=csv_utf8` usw.) mit den Rechten des
  eingeloggten Nutzers - wer eine Collection nicht lesen darf, kann sie auch nicht exportieren.
- Die Texte der Panels kommen aus dem Backend-Übersetzungskatalog (`extended_panel_*`) und folgen
  der Sprache der Directus-Oberfläche. Der Marker `[Erweitert]` bleibt in jeder Sprache gleich.
- Das Seiten-Export rendert das Dashboard im Browser zu einem Bild (`html-to-image`) und legt es per
  `jspdf` ins PDF. Texte im PDF sind daher nicht markierbar; für die Daten gibt es den
  Listen-Export.
- Vorhandene eingebaute Listen-Panels lassen sich mit denselben Einstellungen als
  `Liste [Erweitert]` neu anlegen.
