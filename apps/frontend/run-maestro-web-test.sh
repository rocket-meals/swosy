#!/bin/bash
# =============================================================================
# Maestro Web Smoke Test Runner
# =============================================================================
# Usage (from apps/frontend/):
#   ./run-maestro-web-test.sh
#
# Or via yarn (from apps/frontend/app/):
#   yarn web      # start Expo web dev server
#   yarn maestro  # install Maestro (if needed) and run all Maestro tests
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAESTRO_DIR="$SCRIPT_DIR/.maestro"
export PATH="$HOME/.maestro/bin:$PATH"

echo "=== Maestro Web Smoke Test ==="
echo ""

# Install Maestro CLI if not already installed
if ! command -v maestro &> /dev/null; then
    echo "Maestro CLI not found – installing..."
    curl -fsSL "https://get.maestro.mobile.dev" | bash
fi

if ! command -v maestro &> /dev/null; then
    echo "ERROR: Maestro CLI installation failed."
    echo "Install manually: curl -fsSL \"https://get.maestro.mobile.dev\" | bash"
    exit 1
fi

echo "Make sure your Expo web dev server is running:"
echo "  cd apps/frontend/app && yarn web"
echo ""
echo "Running Maestro tests..."
echo ""

maestro test "$MAESTRO_DIR/web-smoke-test.yaml" --platform web
