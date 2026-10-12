# Wartungsserver

Kleiner Node.js-Server ohne Abhängigkeiten, der anstelle von Directus antwortet, solange Directus nicht läuft, zum
Beispiel beim Neustart durch `scripts/update-and-generate-env.sh` oder bei einem Absturz.

## Ablauf

- **Directus läuft:** Traefik schickt alle Anfragen an Directus. Der Wartungsserver ruft alle 60 Sekunden die
  öffentlichen `app_settings` ab (dieselbe Abfrage wie die App) und behält die letzte Antwort im Speicher.
- **Directus läuft nicht:** Traefik schickt die Anfragen an den Wartungsserver. Der antwortet auf
  `GET /items/app_settings` mit der gemerkten Kopie samt Wartungsfenster. Die App behält damit alle Einstellungen und
  zeigt den Wartungsbanner. Alle anderen Anfragen bekommen `503` im Directus-Fehlerformat, die App nutzt dann ihre
  gecachten Daten.

Das Wartungsfenster in der Antwort:

| Situation | `maintenance_start` | `maintenance_end` |
| --- | --- | --- |
| Angekündigtes Fenster läuft gerade | wie angekündigt | wie angekündigt |
| Ohne Ankündigung, vor dem angekündigten Start oder nach dem angekündigten Ende | Beginn des Ausfalls | jetzt + 10 Minuten, aufgerundet auf 5 Minuten |

Der Beginn bleibt während eines Ausfalls gleich, weil die App einen weggeklickten Banner pro `maintenance_start`
merkt. Hat der Server noch keine Kopie (z. B. direkt nach einem Neustart des ganzen Hosts), antwortet er auch auf
`app_settings` mit `503`: Eine Antwort nur mit den Wartungsfeldern würde die gecachten Einstellungen der App
überschreiben.

## Routing

- Der Router hat dieselbe Regel wie der Directus-Router, aber Priorität `1`. Traefik nimmt ihn also nur, wenn es keinen
  Directus-Container gibt.
- Directus hat dafür einen Healthcheck auf `/server/ping`. Traefik ignoriert Container, die noch starten oder unhealthy
  sind. So landen Anfragen während des Hochfahrens nicht als `502` im Leeren.
- `scripts/update-and-generate-env.sh` stoppt beim Neustart alle Dienste außer Traefik und dem Wartungsserver. Direkt
  davor schickt es dem Wartungsserver `SIGHUP`, damit er das eben angekündigte Wartungsfenster sofort abruft.

## Tests

```
node --test apps/maintenance-server/server.test.mjs
```

## Von Hand prüfen

```
docker compose logs -f rocket-meals-maintenance
docker compose stop rocket-meals-directus
curl https://<MYHOST>/<ROCKET_MEALS_PATH>/<ROCKET_MEALS_BACKEND_PATH>/items/app_settings
docker compose up -d rocket-meals-directus
```
