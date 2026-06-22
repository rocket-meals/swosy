#!/bin/bash
# =============================================================================
# Maestro Web Smoke Test Runner
# =============================================================================
# Usage:
#   yarn maestro              (from apps/frontend/app/)  – generates + runs tests
#   yarn maestro:runOnly      (from apps/frontend/app/)  – runs tests without regenerating
#   ./run-maestro-web-test.sh [--skip-generate]  (from apps/frontend/)
#
# Flags:
#   --skip-generate   Skip step 4 (YAML generation from TypeScript).
#                     Use when the generated files are already up-to-date.
#
# The script:
#   1. Starts the Expo web dev server in the background (output suppressed)
#   2. Waits until the server is reachable
#   3. Installs Maestro CLI if not already present
#   4. Generates YAML test files from TypeScript  (skipped with --skip-generate)
#   5. Runs all Maestro tests
#   6. Lists failed tests and screenshot paths (on failure)
#   7. Stops the dev server on exit (success or failure)
# =============================================================================

set -e

# ---------------------------------------------------------------------------
# Parse flags
# ---------------------------------------------------------------------------
SKIP_GENERATE=false
for arg in "$@"; do
    case "$arg" in
        --skip-generate)
            SKIP_GENERATE=true
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATED_DIR="$SCRIPT_DIR/maestro-tests/generated"
DEV_URL="http://localhost:8081/"
export PATH="$HOME/.maestro/bin:$PATH"

echo "=== Maestro Web Smoke Test ==="
echo ""

# ---------------------------------------------------------------------------
# 1. Start Expo web dev server in the background (output suppressed)
# ---------------------------------------------------------------------------
echo "Starting Expo web dev server..."
(cd "$SCRIPT_DIR/app" && BROWSER=none npx expo start --web --non-interactive) > /dev/null 2>&1 &
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
if [ "$SKIP_GENERATE" = true ]; then
    echo "Skipping YAML generation (--skip-generate flag set)."
else
    echo "Generating YAML test files from TypeScript..."
    (cd "$SCRIPT_DIR/app" && yarn maestro:generate)
fi
echo ""

# ---------------------------------------------------------------------------
# 5. Run Maestro tests
# ---------------------------------------------------------------------------
MAESTRO_DEBUG_DIR="/tmp/maestro-debug-$$"
mkdir -p "$MAESTRO_DEBUG_DIR"

echo "Running Maestro tests..."
echo ""
set +e
maestro test "$GENERATED_DIR" --platform web --debug-output "$MAESTRO_DEBUG_DIR"
MAESTRO_EXIT_CODE=$?
set -e

# ---------------------------------------------------------------------------
# 6. Report failed tests and screenshot paths
# ---------------------------------------------------------------------------
if [ "$MAESTRO_EXIT_CODE" -ne 0 ]; then
    echo ""
    echo "=== Failed Tests & Screenshots ==="
    FOUND_SCREENSHOTS=false
    while IFS= read -r -d '' png; do
        echo "  📸 $png"
        FOUND_SCREENSHOTS=true
    done < <(find "$MAESTRO_DEBUG_DIR" "$HOME/.maestro/tests" -type f -name "*.png" -print0 2>/dev/null)
    if [ "$FOUND_SCREENSHOTS" = false ]; then
        echo "  (no screenshots found)"
    fi

    echo ""
    echo "=== Failure Reasons ==="
    FOUND_ERRORS=false
    # Search for error/failure messages in Maestro debug log files
    while IFS= read -r -d '' logfile; do
        ERRORS=$(grep -iE "(FAILED|ERROR|Exception|Element not found|No element|Timeout|assert|tapOn)" "$logfile" 2>/dev/null | grep -v "^#" | head -20)
        if [ -n "$ERRORS" ]; then
            echo ""
            echo "  📄 $(basename "$logfile"):"
            echo "$ERRORS" | sed 's/^/    /'
            FOUND_ERRORS=true
        fi
    done < <(find "$MAESTRO_DEBUG_DIR" "$HOME/.maestro/tests" -type f \( -name "*.log" -o -name "*.txt" -o -name "*.xml" \) -print0 2>/dev/null)
    if [ "$FOUND_ERRORS" = false ]; then
        echo "  (no detailed error logs found in $MAESTRO_DEBUG_DIR)"
    fi
    echo ""
    exit "$MAESTRO_EXIT_CODE"
fi
