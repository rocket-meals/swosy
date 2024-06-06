#!/bin/bash

# Function to check if ImageMagick is installed
check_imagemagick() {
    if ! command -v convert &> /dev/null; then
        echo "ImageMagick could not be found."
        read -p "Do you want to install ImageMagick? (y/n): " install_choice

        if [[ "$install_choice" == "y" || "$install_choice" == "Y" ]]; then
            install_imagemagick
        else
            echo "ImageMagick is required to run this script. Exiting."
            exit 1
        fi
    fi
}

# Function to install ImageMagick
install_imagemagick() {
    OS=$(uname)

    if [[ "$OS" == "Linux" ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y imagemagick
        elif command -v yum &> /dev/null; then
            sudo yum install -y imagemagick
        else
            echo "Unsupported Linux distribution. Please install ImageMagick manually."
            exit 1
        fi
    elif [[ "$OS" == "Darwin" ]]; then
        if command -v brew &> /dev/null; then
            brew install imagemagick
        else
            echo "Homebrew is not installed. Please install Homebrew or ImageMagick manually."
            exit 1
        fi
    else
        echo "Unsupported operating system. Please install ImageMagick manually."
        exit 1
    fi
}

# Function to print usage help
print_usage() {
    echo "Usage: $0 <path_to_icon> <path_to_company_logo> [output_folder]"
    echo "  <path_to_icon>         Path to the icon file"
    echo "  <path_to_company_logo> Path to the company logo file"
    echo "  [output_folder]        Optional: Path to the output folder. Default is ./app/assets/images/"
}

# Define default output folder
DEFAULT_OUTPUT_FOLDER="./app/assets/images/"
OUTPUT_FOLDER="$DEFAULT_OUTPUT_FOLDER"

# Define image sizes
ADAPTIVE_ICON_SIZE="1024x1024"
FAVICON_SIZE="48x48"
ICON_SIZE="1024x1024"
NOTIFICATION_ICON_SIZE="200x200"
SPLASH_SIZE="1155x2500"

# Function to calculate splash logo width dynamically
calculate_splash_logo_width() {
    local splash_width=$(echo $SPLASH_SIZE | cut -dx -f1)
    SPLASH_LOGO_WIDTH=$(echo "$splash_width * 0.9" | bc)
}

# Function to generate images
generate_images() {
    local icon_path=$1
    local logo_path=$2

    # Ensure the output folder exists
    mkdir -p "$OUTPUT_FOLDER"

    # Generate adaptive-icon.png
    convert "$icon_path" -resize $ADAPTIVE_ICON_SIZE "$OUTPUT_FOLDER/adaptive-icon.png"

    # Generate favicon.png
    convert "$icon_path" -resize $FAVICON_SIZE "$OUTPUT_FOLDER/favicon.png"

    # Generate icon.png
    convert "$icon_path" -resize $ICON_SIZE "$OUTPUT_FOLDER/icon.png"

    # Generate notification-icon.png
    convert "$icon_path" -resize $NOTIFICATION_ICON_SIZE "$OUTPUT_FOLDER/notification-icon.png"

    # Generate splash.png with $logo_path
    # 1. Copy the logo_path image to the output folder but with 90% width of the splash image size and a white background
    calculate_splash_logo_width
    # convert "$logo_path" -resize ${SPLASH_LOGO_WIDTH}x "$OUTPUT_FOLDER/splash-logo.png" # has transparent background
    convert "$logo_path" -resize ${SPLASH_LOGO_WIDTH}x -background white -alpha remove -alpha off "$OUTPUT_FOLDER/splash.png"
    # Extend the splash-logo height to match the splash image height
    convert "$OUTPUT_FOLDER/splash.png" -gravity center -background white -extent ${SPLASH_SIZE} "$OUTPUT_FOLDER/splash.png"

}

# Main script execution
if [ $# -lt 2 ]; then
    echo "Error: Missing required arguments."
    print_usage
    exit 1
fi

ICON_PATH=$1
LOGO_PATH=$2

if [ $# -eq 3 ]; then
    OUTPUT_FOLDER=$3
fi

check_imagemagick
generate_images "$ICON_PATH" "$LOGO_PATH"

echo "Image generation completed. Files are saved in $OUTPUT_FOLDER"
