#!/bin/bash
# This script runs during EAS Build (via eas-build-post-install hook)
# to generate the icon/splash assets from customer source images.
# The generated files are .gitignored and must be recreated on every build.

set -euo pipefail

echo "🖼️ EAS Build: Generating customer icons..."

# Install ImageMagick if not available
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found, installing..."
    OS=$(uname)
    if [[ "$OS" == "Darwin" ]]; then
        if command -v brew &> /dev/null; then
            brew install imagemagick
        else
            echo "ERROR: Homebrew is not installed. Cannot install ImageMagick."
            exit 1
        fi
    elif [[ "$OS" == "Linux" ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y imagemagick
        elif command -v yum &> /dev/null; then
            sudo yum install -y imagemagick
        else
            echo "ERROR: No supported package manager found."
            exit 1
        fi
    else
        echo "ERROR: Unsupported OS for ImageMagick install."
        exit 1
    fi
fi

# Resolve customer icon and company logo paths from config.ts
ICON_PATH=$(node -e "
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'Node16', moduleResolution: 'node16' },
});
const { getCustomerConfig } = require('./config.ts');
console.log(getCustomerConfig().images.icon_logo_source_path);
")

COMPANY_PATH=$(node -e "
require('ts-node').register({
    transpileOnly: true,
    compilerOptions: { module: 'Node16', moduleResolution: 'node16' },
});
const { getCustomerConfig } = require('./config.ts');
console.log(getCustomerConfig().images.company_logo_source_path);
")

echo "Icon source: ${ICON_PATH}"
echo "Company logo source: ${COMPANY_PATH}"

# Run the shared generateIcons.sh script
# On EAS, the working directory is the app directory (apps/frontend/app)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATE_ICONS_SCRIPT="${SCRIPT_DIR}/../../../../scripts/generateIcons.sh"

if [[ ! -f "$GENERATE_ICONS_SCRIPT" ]]; then
    # Fallback: try relative to working directory (apps/frontend/app)
    GENERATE_ICONS_SCRIPT="../../../scripts/generateIcons.sh"
fi

if [[ ! -f "$GENERATE_ICONS_SCRIPT" ]]; then
    echo "ERROR: generateIcons.sh not found"
    exit 1
fi

bash "$GENERATE_ICONS_SCRIPT" "./${ICON_PATH}" "./${COMPANY_PATH}" "./assets/generated/"

echo "✅ Icons generated successfully"
