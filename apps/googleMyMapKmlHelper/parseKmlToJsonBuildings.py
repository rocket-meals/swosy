import xml.etree.ElementTree as ET
import json
import os
import sys

# CLI-controlled paths must stay inside the repository (or the current working
# directory when not running inside a git checkout) before they are accessed.
def require_inside_base_dir(path_value):
    base_dir = os.getcwd()
    current = base_dir
    while True:
        if os.path.isdir(os.path.join(current, '.git')):
            base_dir = current
            break
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    resolved = os.path.realpath(path_value)
    if resolved != base_dir and not resolved.startswith(base_dir + os.sep):
        raise ValueError(f"Refusing to access path outside '{base_dir}': '{resolved}'")
    return resolved

def parse_kml(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    namespace = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    placemarks = root.findall('.//kml:Placemark', namespace)
    result = []

    for placemark in placemarks:
        alias = placemark.find('kml:name', namespace).text
        coordinates_text = placemark.find('.//kml:coordinates', namespace).text.strip()
        lon, lat, _ = map(float, coordinates_text.split(','))
        
        result.append({
            "alias": alias,
            "coordinates": {
                "coordinates": [lon, lat],
                "type": "Point"
            }
        })

    return result

def write_json(data, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_kml_file> <output_json_file>")
        sys.exit(1)

    # Canonicalize the CLI-controlled paths (resolves "..", symlinks) and validate that
    # they stay inside the repository before they are used to read/write files below.
    input_kml_file = require_inside_base_dir(sys.argv[1])
    output_json_file = require_inside_base_dir(sys.argv[2])

    parsed_data = parse_kml(input_kml_file)
    write_json(parsed_data, output_json_file)

    print(f"Data has been successfully written to {output_json_file}")
