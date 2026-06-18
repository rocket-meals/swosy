#!/bin/bash
# =============================================================================
# Maestro Web Smoke Test Runner
# =============================================================================
# Usage (from apps/frontend/):
#   ./run-maestro-web-test.sh
#
# Preferred usage via yarn (from apps/frontend/app/):
#   yarn web              # start Expo web dev server
#   yarn maestro:generate # compile TS tests → maestro-tests/generated/*.yaml
#   yarn maestro          # generate + install Maestro CLI + run all tests
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATED_DIR="$SCRIPT_DIR/maestro-tests/generated"
export PATH="$HOME/.maestro/bin:$PATH"

echo "=== Maestro Web Smoke Test ==="
echo ""

# Generate YAML files from TypeScript test definitions
echo "Generating YAML test files from TypeScript..."
(cd "$SCRIPT_DIR/app" && yarn maestro:generate)
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

maestro test "$GENERATED_DIR" --platform web
