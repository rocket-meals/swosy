#!/bin/bash
# =============================================================================
# Maestro Web Smoke Test Runner
# =============================================================================
# Prerequisites:
#   1. Install Maestro CLI: https://maestro.mobile.dev/getting-started/installing-maestro
#      curl -fsSL "https://get.maestro.mobile.dev" | bash
#
#   2. Start the Expo web dev server first:
#      cd apps/frontend/app && yarn web
#
#   3. Then run this script from apps/frontend/:
#      ./run-maestro-web-test.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAESTRO_DIR="$SCRIPT_DIR/.maestro"

echo "=== Maestro Web Smoke Test ==="
echo ""
echo "Make sure your Expo web dev server is running:"
echo "  cd apps/frontend/app && yarn web"
echo ""

# Check if maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "ERROR: Maestro CLI is not installed."
    echo "Install it with: curl -fsSL \"https://get.maestro.mobile.dev\" | bash"
    exit 1
fi

echo "Running Maestro test..."
echo ""

maestro test "$MAESTRO_DIR/web-smoke-test.yaml" --platform web
