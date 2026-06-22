#!/bin/bash
# =============================================================================
# Maestro Web Smoke Test Runner
# =============================================================================
# Usage:
#   yarn maestro          (from apps/frontend/app/)
#   ./run-maestro-web-test.sh  (from apps/frontend/)
#
# The script:
#   1. Starts the Expo web dev server in the background
#   2. Waits until the server is reachable
#   3. Installs Maestro CLI if not already present
#   4. Generates YAML test files from TypeScript
#   5. Runs all Maestro tests
#   6. Stops the dev server on exit (success or failure)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATED_DIR="$SCRIPT_DIR/maestro-tests/generated"
DEV_URL="http://localhost:8081/"
export PATH="$HOME/.maestro/bin:$PATH"

echo "=== Maestro Web Smoke Test ==="
echo ""

# ---------------------------------------------------------------------------
# 1. Start Expo web dev server in the background
# ---------------------------------------------------------------------------
echo "Starting Expo web dev server..."
(cd "$SCRIPT_DIR/app" && BROWSER=none npx expo start --web --non-interactive) &
WEB_PID=$!

# Stop the dev server (and any child processes) when the script exits
cleanup() {
    echo ""
    echo "Stopping Expo web dev server (PID $WEB_PID)..."
    kill "$WEB_PID" 2>/dev/null || true
    pkill -P "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# 2. Wait until the dev server is reachable
# ---------------------------------------------------------------------------
echo "Waiting for dev server at $DEV_URL ..."
MAX_WAIT=120
for i in $(seq 1 $MAX_WAIT); do
    if curl -sf "$DEV_URL" > /dev/null 2>&1; then
        echo "Server is ready."
        break
    fi
    if [ "$i" -eq "$MAX_WAIT" ]; then
        echo "ERROR: Dev server did not start within ${MAX_WAIT}s."
        exit 1
    fi
    echo "  Waiting... ($i/${MAX_WAIT}s)"
    sleep 1
done
echo ""

# ---------------------------------------------------------------------------
# 3. Install Maestro CLI if not already installed
# ---------------------------------------------------------------------------
if ! command -v maestro &> /dev/null; then
    echo "Maestro CLI not found – installing..."
    curl -fsSL "https://get.maestro.mobile.dev" | bash
    export PATH="$HOME/.maestro/bin:$PATH"
fi

if ! command -v maestro &> /dev/null; then
    echo "ERROR: Maestro CLI installation failed."
    echo "Install manually: curl -fsSL \"https://get.maestro.mobile.dev\" | bash"
    exit 1
fi

# ---------------------------------------------------------------------------
# 4. Generate YAML test files from TypeScript
# ---------------------------------------------------------------------------
echo "Generating YAML test files from TypeScript..."
(cd "$SCRIPT_DIR/app" && yarn maestro:generate)
echo ""

# ---------------------------------------------------------------------------
# 5. Run Maestro tests
# ---------------------------------------------------------------------------
echo "Running Maestro tests..."
echo ""
maestro test "$GENERATED_DIR" --platform web
