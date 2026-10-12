#!/usr/bin/env bash
#
# Holt den neuesten Stand von rocket-meals und rocket-meals-envs, generiert die
# .env, baut die Images und startet die Container neu.
#
# Optionen (als Umgebungsvariablen, damit auch eine ältere Version dieses
# Skripts auf dem Server sie beim ersten Lauf gefahrlos ignoriert):
#   ROCKET_MEALS_FORCE_RESTART=true     Neustart auch ohne neue Commits
#   ROCKET_MEALS_ANNOUNCE_MINUTES=30    Wartung vorab in app_settings ankündigen
#                                       und erst nach so vielen Minuten neu
#                                       starten (Standard 0: ohne Vorankündigung,
#                                       der Wartungsserver zeigt das Fenster ab
#                                       dem Herunterfahren)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_REPO_DIR="${REPO_DIR}/../rocket-meals-envs"
ENV_NAME="${1:-}"

FORCE_RESTART="${ROCKET_MEALS_FORCE_RESTART:-false}"
ANNOUNCE_MINUTES="${ROCKET_MEALS_ANNOUNCE_MINUTES:-0}"

# Dauer der letzten Neustarts (Unix-Zeit + Sekunden pro Zeile). Liegt nicht im
# Git (.gitignore), damit "git reset --hard" sie nicht verwirft.
RESTART_DURATIONS_FILE="${REPO_DIR}/.restart-durations"
RESTART_DURATIONS_KEEP=10
DEFAULT_RESTART_DURATION_SECONDS=600
HEALTH_TIMEOUT_SECONDS=900

# Wird von .github/actions/deploy-server ausgewertet.
RESTART_SKIPPED_MARKER="ROCKET_MEALS_RESTART_SKIPPED"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

AVAILABLE_ENVS=("studi-futter" "swosy" "test")

# Auto-detect ENV_NAME via customer-config.sh when not provided as argument.
# customer-config.sh uses GITHUB_REPOSITORY; derive it from the git remote URL if unset.
if [[ -z "$ENV_NAME" ]]; then
  if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
    REMOTE_URL="$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null || true)"
    # Normalize both https and ssh remote URLs to "owner/repo"
    GITHUB_REPOSITORY="$(echo "$REMOTE_URL" | sed -E 's#(https://github\.com/|git@github\.com:)##; s#\.git$##')"
    export GITHUB_REPOSITORY
  fi
  log "Erkenne Umgebung anhand von GITHUB_REPOSITORY='$GITHUB_REPOSITORY'"
  ENV_NAME="$(GITHUB_REPOSITORY="$GITHUB_REPOSITORY" bash "$REPO_DIR/scripts/customer-config.sh" | grep '^CUSTOMER=' | cut -d= -f2)"
  if [[ -z "$ENV_NAME" ]]; then
    echo "Fehler: Umgebungsname konnte nicht automatisch erkannt werden." >&2
    echo "Bitte als Argument übergeben: $0 <env-name>" >&2
    echo "Verfügbare Umgebungen: ${AVAILABLE_ENVS[*]}" >&2
    exit 1
  fi
  log "Automatisch erkannte Umgebung: '$ENV_NAME'"
fi

VALID=false
for env in "${AVAILABLE_ENVS[@]}"; do
  if [[ "$env" == "$ENV_NAME" ]]; then
    VALID=true
    break
  fi
done

if [[ "$VALID" != "true" ]]; then
  echo "Fehler: Ungültige Umgebung '$ENV_NAME'." >&2
  echo "Verfügbare Umgebungen: ${AVAILABLE_ENVS[*]}" >&2
  exit 1
fi

if [[ "$FORCE_RESTART" != "true" && "$FORCE_RESTART" != "false" ]]; then
  echo "Fehler: ROCKET_MEALS_FORCE_RESTART muss 'true' oder 'false' sein (ist '$FORCE_RESTART')." >&2
  exit 1
fi
if ! [[ "$ANNOUNCE_MINUTES" =~ ^[0-9]+$ ]]; then
  echo "Fehler: ROCKET_MEALS_ANNOUNCE_MINUTES muss eine ganze Zahl sein (ist '$ANNOUNCE_MINUTES')." >&2
  exit 1
fi

# --- Hilfsfunktionen für das Wartungsfenster ---

# maintenance_start/_end sind timestamp-Felder (mit Zeitzone), daher UTC.
format_utc_time() {
  local epoch_seconds="$1"
  date -u -d "@$epoch_seconds" '+%Y-%m-%dT%H:%M:%SZ'
}

# Längste der letzten Neustart-Dauern, damit das angezeigte Ende eher zu spät
# als zu früh liegt.
estimate_restart_seconds() {
  local max=0 seconds
  if [[ -f "$RESTART_DURATIONS_FILE" ]]; then
    while read -r _ seconds; do
      if [[ "$seconds" =~ ^[0-9]+$ ]] && (( seconds > max )); then
        max="$seconds"
      fi
    done < "$RESTART_DURATIONS_FILE"
  fi
  if (( max == 0 )); then
    max="$DEFAULT_RESTART_DURATION_SECONDS"
  fi
  echo "$max"
}

record_restart_seconds() {
  local duration_seconds="$1"
  local tmp="${RESTART_DURATIONS_FILE}.tmp"
  { [[ -f "$RESTART_DURATIONS_FILE" ]] && cat "$RESTART_DURATIONS_FILE"; echo "$(date +%s) $duration_seconds"; } | tail -n "$RESTART_DURATIONS_KEEP" > "$tmp"
  mv "$tmp" "$RESTART_DURATIONS_FILE"
}

# Setzt bzw. leert app_settings.maintenance_start/_end über die Directus-API im
# laufenden Container. Fehler werden nur geloggt: Die Ankündigung darf den
# Neustart nie verhindern.
maintenance_window() {
  local action="$1" start="${2:-}" end="${3:-}"
  if ! docker compose exec -T \
    -e MAINTENANCE_ACTION="$action" \
    -e MAINTENANCE_START="$start" \
    -e MAINTENANCE_END="$end" \
    rocket-meals-directus node --input-type=module - < "$REPO_DIR/scripts/maintenance-window.mjs"; then
    log "Warnung: Wartungsfenster konnte nicht gesetzt werden ($action)"
  fi
}

is_directus_healthy() {
  docker compose exec -T rocket-meals-directus sh -c 'curl -fsS -o /dev/null "http://localhost:${PORT}/server/health"' >/dev/null 2>&1
}

is_directus_running() {
  [[ -n "$(docker compose ps --status running -q rocket-meals-directus 2>/dev/null)" ]]
}

# Traefik und der Wartungsserver (apps/maintenance-server) laufen beim Neustart
# weiter: Solange Directus fehlt, beantwortet der Wartungsserver die Anfragen
# nach den app_settings mit dem Wartungsfenster, statt dass die App ins Leere läuft.
KEEP_RUNNING_SERVICES=("traefik" "rocket-meals-maintenance")

restart_services() {
  local service keep keep_service
  for service in $(docker compose config --services); do
    keep=false
    for keep_service in "${KEEP_RUNNING_SERVICES[@]}"; do
      if [[ "$service" == "$keep_service" ]]; then
        keep=true
      fi
    done
    if [[ "$keep" == "false" ]]; then
      echo "$service"
    fi
  done
}

stop_restart_services() {
  # shellcheck disable=SC2046 # Dienstnamen enthalten keine Leerzeichen
  docker compose rm --stop --force $(restart_services)
}

# Kündigt dem Wartungsserver (apps/maintenance-server) den Neustart an: Er holt
# sich app_settings, Server-Info und Logo ein letztes Mal und setzt das
# Wartungsfenster selbst, von jetzt bis zum geschätzten Ende. Ein in Directus
# eingetragenes, gerade laufendes Fenster hat Vorrang. Der Steuer-Port ist nur
# im Container selbst erreichbar (127.0.0.1).
prepare_maintenance_server() {
  local end="$1" window
  if window="$(docker compose exec -T rocket-meals-maintenance \
    wget -qO- --header 'Content-Type: application/json' --post-data "{\"maintenance_end\":\"$end\"}" \
    "http://127.0.0.1:8081/prepare" 2>/dev/null)"; then
    log "Wartungsserver vorbereitet: $window"
  else
    log "Warnung: Wartungsserver nicht erreichbar, die App bekommt während des Neustarts keine Wartungsanzeige"
  fi
}

log "Starte Update und Env-Generierung in $REPO_DIR (Umgebung: $ENV_NAME)"
cd "$REPO_DIR"

# --- Auf Änderungen prüfen ---
log "Hole neue Änderungen (git fetch)"
git fetch origin
BRANCH="$(git rev-parse --abbrev-ref HEAD)" || { log "Fehler: Aktuellen Branch konnte nicht ermittelt werden (detached HEAD?)" >&2; exit 1; }

if [[ ! -d "$ENV_REPO_DIR" ]]; then
  echo "Fehler: Verzeichnis '$ENV_REPO_DIR' wurde nicht gefunden." >&2
  echo "Bitte stelle sicher, dass das Repository 'rocket-meals-envs' im übergeordneten Ordner liegt." >&2
  exit 1
fi
git -C "$ENV_REPO_DIR" fetch || { log "Fehler: git fetch in rocket-meals-envs fehlgeschlagen" >&2; exit 1; }

RESTART_REASONS=()
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH")" ]]; then
  RESTART_REASONS+=("rocket-meals hat neue Commits")
fi
if [[ "$(git -C "$ENV_REPO_DIR" rev-parse HEAD)" != "$(git -C "$ENV_REPO_DIR" rev-parse '@{u}')" ]]; then
  RESTART_REASONS+=("rocket-meals-envs hat neue Commits")
fi
if [[ ! -f "$REPO_DIR/.env" ]]; then
  RESTART_REASONS+=("keine .env vorhanden (Ersteinrichtung?)")
elif ! is_directus_running; then
  RESTART_REASONS+=("Directus läuft nicht")
fi
if [[ "$FORCE_RESTART" == "true" ]]; then
  RESTART_REASONS+=("Neustart erzwungen")
fi

if (( ${#RESTART_REASONS[@]} == 0 )); then
  log "Keine Änderungen in rocket-meals und rocket-meals-envs, Neustart wird übersprungen"
  echo "$RESTART_SKIPPED_MARKER"
  exit 0
fi
log "Neustart nötig: $(IFS=','; echo "${RESTART_REASONS[*]}")"

# --- Update und Build, während die alten Container noch laufen ---
log "Aktualisiere rocket-meals (git reset --hard origin/$BRANCH)"
git reset --hard "origin/$BRANCH"

log "Aktualisiere rocket-meals-envs Repository"
git -C "$ENV_REPO_DIR" stash || true
git -C "$ENV_REPO_DIR" pull || { log "Fehler: Aktualisierung von rocket-meals-envs fehlgeschlagen" >&2; exit 1; }
git -C "$ENV_REPO_DIR" stash pop || true

log "Generiere .env für Umgebung '$ENV_NAME'"
(cd "$ENV_REPO_DIR" && yarn generate --env "$ENV_NAME" --output "$REPO_DIR/.env")

if [[ ! -f "$REPO_DIR/.env" ]]; then
  echo "Fehler: .env wurde nach der Generierung nicht gefunden." >&2
  exit 1
fi

log ".env erfolgreich generiert"

# Der Build läuft vor "docker compose down": Die alten Container bedienen die
# Nutzer weiter, und ein fehlgeschlagener Build verursacht keine Ausfallzeit.
log "Baue Images neu (docker compose build)"
docker compose build

# --- Wartung ankündigen ---
NOW_EPOCH="$(date +%s)"
MAINTENANCE_START_EPOCH=$(( NOW_EPOCH + ANNOUNCE_MINUTES * 60 ))
ESTIMATED_SECONDS="$(estimate_restart_seconds)"
# 20 % Puffer, aufgerundet auf volle 5 Minuten
ESTIMATED_SECONDS=$(( (ESTIMATED_SECONDS * 12 / 10 + 299) / 300 * 300 ))
MAINTENANCE_START="$(format_utc_time "$MAINTENANCE_START_EPOCH")"
MAINTENANCE_END="$(format_utc_time $(( MAINTENANCE_START_EPOCH + ESTIMATED_SECONDS )))"

# Nur mit Vorankündigung wird das Fenster in app_settings geschrieben, damit
# die App schon vorher warnt. Sonst setzt es der Wartungsserver beim Herunterfahren.
if (( ANNOUNCE_MINUTES > 0 )); then
  if is_directus_running; then
    log "Kündige Wartung an: $MAINTENANCE_START bis voraussichtlich $MAINTENANCE_END"
    maintenance_window set "$MAINTENANCE_START" "$MAINTENANCE_END"
  else
    log "Directus läuft nicht, Wartung wird nicht angekündigt"
  fi
  log "Warte $ANNOUNCE_MINUTES Minuten bis zum Neustart ($MAINTENANCE_START)"
  sleep $(( MAINTENANCE_START_EPOCH - $(date +%s) > 0 ? MAINTENANCE_START_EPOCH - $(date +%s) : 0 ))
fi

# --- Neustart ---
RESTART_START_EPOCH="$(date +%s)"

prepare_maintenance_server "$MAINTENANCE_END"

log "Container außer ${KEEP_RUNNING_SERVICES[*]} werden gestoppt"
stop_restart_services

# "up" startet auch Traefik und den Wartungsserver, falls sie noch nicht laufen
# oder sich ihre Konfiguration geändert hat.
log "Starte Container im Hintergrund (docker compose up -d) – erster Start"
docker compose up -d --remove-orphans

log "Stoppe Container außer ${KEEP_RUNNING_SERVICES[*]} – Neustart damit Apple Client Secret korrekt geladen wird"
stop_restart_services

log "Starte Container im Hintergrund (docker compose up -d) – zweiter Start"
docker compose up -d

log "Warte, bis Directus wieder erreichbar ist (max. ${HEALTH_TIMEOUT_SECONDS}s)"
until is_directus_healthy; do
  if (( $(date +%s) - RESTART_START_EPOCH > HEALTH_TIMEOUT_SECONDS )); then
    log "Fehler: Directus ist nach ${HEALTH_TIMEOUT_SECONDS}s nicht erreichbar, Wartungsfenster bleibt gesetzt" >&2
    exit 1
  fi
  sleep 5
done

RESTART_SECONDS=$(( $(date +%s) - RESTART_START_EPOCH ))
record_restart_seconds "$RESTART_SECONDS"
log "Directus ist nach ${RESTART_SECONDS}s wieder erreichbar"

# Ein laufendes oder abgelaufenes Wartungsfenster leeren, damit die App nach
# dem Neustart keine Wartung mehr anzeigt. Ein für später geplantes bleibt.
maintenance_window clear

log "Update und Env-Generierung erfolgreich abgeschlossen"
