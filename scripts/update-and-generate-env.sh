#!/usr/bin/env bash

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_REPO_DIR="${REPO_DIR}/../rocket-meals-envs"
ENV_NAME="${1:-}"

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

log "Starte Update und Env-Generierung in $REPO_DIR (Umgebung: $ENV_NAME)"
cd "$REPO_DIR"

if [[ -f "$REPO_DIR/.env" ]]; then
  log "Container werden gestoppt (docker compose down)"
  docker compose down
else
  log "Keine .env Datei vorhanden – docker compose down wird übersprungen (Ersteinrichtung?)"
fi

log "Hole neue Änderungen (git fetch + reset)"
git fetch origin
BRANCH="$(git rev-parse --abbrev-ref HEAD)" || { log "Fehler: Aktuellen Branch konnte nicht ermittelt werden (detached HEAD?)" >&2; exit 1; }
git reset --hard "origin/$BRANCH"

# --- Env-Datei generieren ---
if [[ ! -d "$ENV_REPO_DIR" ]]; then
  echo "Fehler: Verzeichnis '$ENV_REPO_DIR' wurde nicht gefunden." >&2
  echo "Bitte stelle sicher, dass das Repository 'rocket-meals-envs' im übergeordneten Ordner liegt." >&2
  exit 1
fi

log "Aktualisiere rocket-meals-envs Repository"
git -C "$ENV_REPO_DIR" pull || { log "Fehler: Aktualisierung von rocket-meals-envs fehlgeschlagen" >&2; exit 1; }

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

# --- Apple client secret: Warten auf Generierung und Neustart ---
# Der backend-sync Service generiert AUTH_APPLE_CLIENT_SECRET beim ersten Start und schreibt es in
# die .env-Datei. Da die laufenden Container die Env-Variablen bereits beim Start eingelesen haben,
# muss nach der Generierung ein Neustart erfolgen, damit das neue Secret übernommen wird.

APPLE_SECRET_BEFORE="$(grep '^AUTH_APPLE_CLIENT_SECRET=' "$REPO_DIR/.env" 2>/dev/null | cut -d= -f2- || true)"
APPLE_HOOK_CONFIGURED=false
if grep -qE '^AUTH_APPLE_HOOK_(APPLE_)?PRIVATE_KEY=.+' "$REPO_DIR/.env" 2>/dev/null; then
  APPLE_HOOK_CONFIGURED=true
fi

if [[ "$APPLE_HOOK_CONFIGURED" == "true" && -z "$APPLE_SECRET_BEFORE" ]]; then
  log "Apple SSO konfiguriert, aber noch kein AUTH_APPLE_CLIENT_SECRET vorhanden."
  log "Warte auf Generierung durch backend-sync (max. 120s)..."

  MAX_WAIT=120
  WAITED=0
  INTERVAL=5
  APPLE_SECRET_GENERATED=""

  while [[ $WAITED -lt $MAX_WAIT ]]; do
    sleep $INTERVAL
    WAITED=$((WAITED + INTERVAL))
    APPLE_SECRET_GENERATED="$(grep '^AUTH_APPLE_CLIENT_SECRET=' "$REPO_DIR/.env" 2>/dev/null | cut -d= -f2- || true)"
    if [[ -n "$APPLE_SECRET_GENERATED" ]]; then
      log "AUTH_APPLE_CLIENT_SECRET wurde nach ${WAITED}s generiert."
      break
    fi
    log "Warte auf AUTH_APPLE_CLIENT_SECRET... (${WAITED}/${MAX_WAIT}s)"
  done

  if [[ -n "$APPLE_SECRET_GENERATED" ]]; then
    log "Starte Container neu, damit das neue Apple client secret übernommen wird (docker compose down)"
    docker compose down
    log "Starte Container mit neuem Apple client secret (docker compose up -d)"
    docker compose up -d
  else
    log "Warnung: AUTH_APPLE_CLIENT_SECRET wurde innerhalb von ${MAX_WAIT}s nicht generiert. Container laufen ohne Apple client secret."
  fi
else
  if [[ "$APPLE_HOOK_CONFIGURED" == "false" ]]; then
    log "Apple SSO nicht konfiguriert – kein Neustart für Apple client secret erforderlich."
  else
    log "AUTH_APPLE_CLIENT_SECRET bereits vorhanden – kein zusätzlicher Neustart erforderlich."
  fi
fi

log "Update und Env-Generierung erfolgreich abgeschlossen"
