# Wartungsserver

Kleiner Node.js-Server ohne Abhängigkeiten, der anstelle von Directus antwortet, solange Directus nicht läuft, zum
Beispiel beim Neustart durch `scripts/update-and-generate-env.sh` oder bei einem Absturz.

## Ablauf

- **Directus läuft:** Traefik schickt alle Anfragen an Directus. Der Wartungsserver holt alle 60 Sekunden die
  öffentlichen `app_settings` (dieselbe Abfrage wie die App), `/server/info` (Projektname, Farbe, Logo) und das
  Projekt-Logo und behält sie im Speicher.
- **Directus läuft nicht:** Traefik schickt die Anfragen an den Wartungsserver. Der beantwortet `GET /items/app_settings`
  (samt Wartungsfenster), `GET /server/info` und das Logo aus seiner Kopie. Die App behält damit Einstellungen, Logo und
  Projektfarbe und zeigt den Wartungsbanner. Alle anderen Anfragen bekommen `503` im Directus-Fehlerformat, auch
  `/server/health`, die App nutzt dann ihre gecachten Daten.

## Wartungsfenster

Direkt vor dem Herunterfahren ruft `scripts/update-and-generate-env.sh` im Container den Steuer-Port auf
(`POST http://127.0.0.1:8081/prepare` mit dem geschätzten Ende). Der Port ist nur im Container selbst erreichbar. Der
Wartungsserver holt sich dann alles ein letztes Mal und setzt das Fenster selbst.

| Situation | `maintenance_start` | `maintenance_end` |
| --- | --- | --- |
| In Directus eingetragenes Fenster läuft gerade | wie eingetragen | wie eingetragen |
| Geplanter Neustart über das Skript | Zeitpunkt der Vorbereitung | geschätztes Ende, bei Überziehung jetzt + 10 Minuten |
| Ausfall ohne Vorbereitung (Absturz) | Beginn des Ausfalls | jetzt + 10 Minuten, aufgerundet auf 5 Minuten |

Der Beginn bleibt während eines Ausfalls gleich, weil die App einen weggeklickten Banner pro `maintenance_start`
merkt. Hat der Server noch keine Kopie (z. B. direkt nach einem Neustart des ganzen Hosts), antwortet er auch auf
`app_settings` mit `503`: Eine Antwort nur mit den Wartungsfeldern würde die gecachten Einstellungen der App
überschreiben.

## Routing

- Der Router hat dieselbe Regel wie der Directus-Router, aber Priorität `1`. Traefik nimmt ihn also nur, wenn es keinen
  Directus-Container gibt.
- Directus hat dafür einen Healthcheck auf `/server/ping`. Traefik ignoriert Container, die noch starten oder unhealthy
  sind. So landen Anfragen während des Hochfahrens nicht als `502` im Leeren.
- `scripts/update-and-generate-env.sh` stoppt beim Neustart alle Dienste außer Traefik und dem Wartungsserver.

## Tests

```
node --test apps/maintenance-server/server.test.mjs
```

## Von Hand prüfen

```
docker compose logs -f rocket-meals-maintenance
# Neustart ankündigen, Ende in 15 Minuten (wie das Skript es macht)
docker compose exec -T rocket-meals-maintenance wget -qO- --header 'Content-Type: application/json' \
  --post-data "{\"maintenance_end\":\"$(date -u -d '+15 min' +%Y-%m-%dT%H:%M:%SZ)\"}" http://127.0.0.1:8081/prepare
docker compose stop rocket-meals-directus
curl "https://<MYHOST>/<ROCKET_MEALS_PATH>/<ROCKET_MEALS_BACKEND_PATH>/items/app_settings?fields=maintenance_start,maintenance_end"
curl "https://<MYHOST>/<ROCKET_MEALS_PATH>/<ROCKET_MEALS_BACKEND_PATH>/server/info"
docker compose start rocket-meals-directus
```
