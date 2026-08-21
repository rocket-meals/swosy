# Dashboards (Insights) - System-Dashboards vs. eigene Dashboards

## Warum

Bei jedem Start des Containers `rocket-meals-database-sync` wird der Dashboard-Stand aus dem
Repository (`data/directus-sync-data/configuration/directus-config/collections/dashboards.json`) per
`directus-sync push` eingespielt. Änderungen, die jemand auf einem Kundenserver an einem
ausgelieferten Dashboard vornimmt, sind danach wieder weg.

Damit niemand Arbeit in ein Dashboard steckt, das beim nächsten Update ohnehin zurückgesetzt wird,
sind ausgelieferte Dashboards auf Kundenservern schreibgeschützt.

## Wie ein System-Dashboard erkannt wird

Am Suffix im Namen, z. B. `Mensen (System)`.

Single source of truth ist `SystemDashboardHelper` in
`packages/common/src/SystemDashboardHelper.ts`:

| Member                  | Bedeutung                                          |
| ----------------------- | -------------------------------------------------- |
| `SYSTEM_NAME_SUFFIX`    | Der Marker selbst (`(System)`)                     |
| `isSystemDashboardName` | Prüft, ob ein Name ein System-Dashboard bezeichnet |
| `withSystemSuffix`      | Ergänzt den Marker (idempotent)                    |
| `withoutSystemSuffix`   | Entfernt den Marker wieder                         |

Panels haben keinen eigenen Marker - sie sind geschützt, wenn das Dashboard, zu dem sie gehören, ein
System-Dashboard ist.

## Was der Hook macht

`Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/dashboard-protection-hook`

- `dashboards.update` / `dashboards.delete`: **HTTP 403**, wenn ein betroffenes Dashboard ein
  System-Dashboard ist.
- `panels.create` / `panels.update` / `panels.delete`: **HTTP 403**, wenn das Panel zu einem
  System-Dashboard gehört oder in eines verschoben werden soll.
- `dashboards.create` durch den **ADMIN_EMAIL**-User: der Marker wird ergänzt, falls er fehlt - neue
  ausgelieferte Dashboards sind damit von Anfang an gekennzeichnet.
- `dashboards.create` / `dashboards.update` durch andere Nutzer: ein selbst gesetzter
  `(System)`-Marker wird entfernt, damit sich niemand versehentlich aus dem eigenen Dashboard
  aussperrt.

### Wer darf was

| Instanz      | ADMIN_EMAIL-User | Andere Nutzer                                  |
| ------------ | ---------------- | ---------------------------------------------- |
| Testsystem   | alles            | alles, im Rahmen ihrer Directus-Rechte         |
| Kundenserver | alles            | nur eigene Dashboards, keine System-Dashboards |

Gemeint ist ausdrücklich der Benutzer aus der Umgebungsvariable `ADMIN_EMAIL`, nicht jeder Nutzer
mit Administrator-Rolle. Dieser Bypass ist auch technisch notwendig: Der Deploy-Sync meldet sich mit
genau diesem Account an - würde er blockiert, würde jeder Container-Start am Push scheitern. Interne
Aufrufe ohne Accountability (z. B. andere Hooks) sind ebenfalls ausgenommen.

### Konfiguration

| Variable               | Default | Bedeutung                                                               |
| ---------------------- | ------- | ----------------------------------------------------------------------- |
| `DASHBOARD_PROTECTION` | leer    | leer = automatisch (überall an außer auf dem Testsystem), `false` = aus |

Das Testsystem wird über `PUBLIC_URL` erkannt (Abgleich mit `ServerHelper.TEST_SERVER_CONFIG`). Der
Default ist bewusst "geschützt": Ein auf einem Kundenserver vergessener Eintrag darf nicht dazu
führen, dass unbemerkt Kundenarbeit verloren geht.

## Ein neues System-Dashboard ausliefern

1. Auf dem Testsystem als `ADMIN_EMAIL`-User anlegen (der Marker wird automatisch ergänzt).
2. `yarn workspace backend-sync sync:pull-from-test-system`
3. Änderungen an `data/directus-sync-data` committen und ausrollen.
