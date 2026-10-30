#!/usr/bin/env bash
#
# Öffnet das interaktive iOS-Credentials-Menü von EAS für eine App, z.B. um ein
# ablaufendes Distribution Certificate neu zu erzeugen. Prüft vorher, ob man bei
# Expo eingeloggt ist, und startet sonst erst `eas login`.
#
# Aufruf über die Root-package.json, z.B.:
#   yarn ios-credentials:rocket-meals
#
# Direkt:
#   bash scripts/eas-ios-credentials.sh <app-verzeichnis>
#
# Im Menü: Build-Profil "production" -> Build Credentials -> Distribution
# Certificate -> neues Zertifikat erzeugen. Das Zertifikat gilt für das ganze
# Apple-Team. Die anderen Apps im selben Team danach mit ihrem eigenen
# ios-credentials-Befehl auf das neue (schon vorhandene) Zertifikat umstellen.
# Das passende Provisioning Profile erzeugt der nächste CI-Build selbst.
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${1:-}"

if [ -z "$APP_DIR" ] || [ ! -d "$ROOT_DIR/$APP_DIR" ]; then
  echo "❌ Aufruf: bash scripts/eas-ios-credentials.sh <app-verzeichnis> (z.B. apps/frontend/app)"
  exit 1
fi

if [ ! -f "$ROOT_DIR/$APP_DIR/eas.json" ]; then
  echo "❌ $APP_DIR/eas.json fehlt. Für Rocket Meals vorher 'yarn workspace rocket-meals-scripts generate:eas' ausführen."
  exit 1
fi

# Ein global installiertes eas-cli bevorzugen, sonst die aktuelle Version per npx.
if command -v eas >/dev/null 2>&1; then
  EAS=(eas)
else
  echo "ℹ️  eas-cli ist nicht installiert, nutze npx eas-cli@latest (dauerhaft: npm install -g eas-cli)"
  EAS=(npx --yes eas-cli@latest)
fi

if ! "${EAS[@]}" whoami >/dev/null 2>&1; then
  echo "🔑 Nicht bei Expo eingeloggt, starte eas login..."
  "${EAS[@]}" login
fi
echo "✅ Eingeloggt als $("${EAS[@]}" whoami)"

cd "$ROOT_DIR/$APP_DIR"
"${EAS[@]}" credentials --platform ios
