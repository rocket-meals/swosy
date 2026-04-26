#!/usr/bin/env bash

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_REPO_DIR="${REPO_DIR}/../rocket-meals-env"
ENV_NAME="${1:-}"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

AVAILABLE_ENVS=("studi-futter" "swosy" "test")

if [[ -z "$ENV_NAME" ]]; then
  echo "Fehler: Kein Umgebungsname angegeben." >&2
  echo "Verwendung: $0 <env-name>" >&2
  echo "Verfügbare Umgebungen: ${AVAILABLE_ENVS[*]}" >&2
  exit 1
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

log "Starte Update und Env-Generierung in $REPO_DIR (Umgebung: $ENV_NAME)"
cd "$REPO_DIR"

log "Container werden gestoppt (docker compose down)"
docker compose down

log "Hole neue Änderungen (git fetch + reset)"
git fetch origin
BRANCH="$(git rev-parse --abbrev-ref HEAD)" || { log "Fehler: Aktuellen Branch konnte nicht ermittelt werden (detached HEAD?)" >&2; exit 1; }
git reset --hard "origin/$BRANCH"

# --- Env-Datei generieren ---
if [[ ! -d "$ENV_REPO_DIR" ]]; then
  echo "Fehler: Verzeichnis '$ENV_REPO_DIR' wurde nicht gefunden." >&2
  echo "Bitte stelle sicher, dass das Repository 'rocket-meals-env' im übergeordneten Ordner liegt." >&2
  exit 1
fi

log "Aktualisiere rocket-meals-env Repository"
git -C "$ENV_REPO_DIR" pull || { log "Fehler: Aktualisierung von rocket-meals-env fehlgeschlagen" >&2; exit 1; }

log "Generiere .env für Umgebung '$ENV_NAME'"
(cd "$ENV_REPO_DIR" && yarn generate --env "$ENV_NAME" --output "$REPO_DIR/.env")

if [[ ! -f "$REPO_DIR/.env" ]]; then
  echo "Fehler: .env wurde nach der Generierung nicht gefunden." >&2
  exit 1
fi

log ".env erfolgreich generiert"

log "Baue Images neu (docker compose build)"
docker compose build

log "Starte Container im Hintergrund (docker compose up -d)"
docker compose up -d

log "Update und Env-Generierung erfolgreich abgeschlossen"
