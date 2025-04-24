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

generate_splash_icon() {
    local splash_icon_size="1024x1024"
    local splash_icon_path="$OUTPUT_FOLDER/splash-icon.png"

    # Resize company.png to fit within 90% of splash icon size (921px max)
    local icon_max_size=921
    convert "$OUTPUT_FOLDER/company.png" -resize ${icon_max_size}x${icon_max_size} \
        -gravity center -background none -extent $splash_icon_size "$splash_icon_path"
}

generate_adaptive_icon() {
    local icon_path=$1
    local output_path="$OUTPUT_FOLDER/adaptive-icon.png"

    # Berechne Zielgröße für das Icon: 1024 * 0.84 = ca. 860px (um etwas Abstand zu lassen)
    # 680 # aka 66% von 1024
    local icon_size=$(echo "1024 / 100 * 69" | bc)

    convert "$icon_path" -resize ${icon_size}x${icon_size} \
        -gravity center -background none -extent $ADAPTIVE_ICON_SIZE "$output_path"
}

generate_adaptive_icon_background() {
    local output_path="$OUTPUT_FOLDER/adaptive-icon-background.png"

    # Erzeuge weißes (nicht transparentes) Bild
    convert -size $ADAPTIVE_ICON_SIZE xc:white "$output_path"
}



# Function to generate images
generate_images() {
    local icon_path=$1
    local logo_path=$2

    # Ensure the output folder exists
    mkdir -p "$OUTPUT_FOLDER"

    # Generate adaptive-icon.png # Ignore adaptive icon for now
    #convert "$icon_path" -resize $ADAPTIVE_ICON_SIZE "$OUTPUT_FOLDER/adaptive-icon.png"

    # Generate favicon.png
    convert "$icon_path" -resize $FAVICON_SIZE "$OUTPUT_FOLDER/favicon.png"

    # Generate icon.png
    convert "$icon_path" -resize $ICON_SIZE "$OUTPUT_FOLDER/icon.png"

    # Generate notification-icon.png
    convert "$icon_path" -resize $NOTIFICATION_ICON_SIZE "$OUTPUT_FOLDER/notification-icon.png"

    # Copy the logo_path image to the output folder
    cp "$logo_path" "$OUTPUT_FOLDER/company.png"

    generate_adaptive_icon "$icon_path"
    generate_adaptive_icon_background

    # Generate splash-icon.png
    generate_splash_icon
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
