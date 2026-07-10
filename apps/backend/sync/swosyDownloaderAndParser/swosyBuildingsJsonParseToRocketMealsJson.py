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

def parse_swosy_to_rocket_meals(swosy_data):
    rocket_meals_data = []
    for building in swosy_data:
        new_building = {
            "status": "draft",
            "sort": None,
            "user_updated": None,
            "date_updated": None,
            "alias": building.get("name"),
            "external_identifier": building.get("short"),
            "url": None,
            "image": None,
            "image_remote_url": None,
            "image_thumb_hash": None,
            "date_of_construction": None,
            "coordinates": {
                "coordinates": [
                    building.get("longitude"),
                    building.get("latitude")
                ],
                "type": "Point"
            },
            "apartments": [],
            "translations": [],
            "businesshours": []
        }

        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

        for day in days:
            if building.get(f"opening_time_{day}") and building.get(f"closing_time_{day}"):
                businesshours_entry = {
                    "businesshours_id": {
                        "time_start": building.get(f"opening_time_{day}"),
                        "time_end": building.get(f"closing_time_{day}"),
                        "date_valid_from": None,
                        "date_valid_till": None
                    }
                }
                for d in days:
                    businesshours_entry["businesshours_id"][d] = (d == day)

                new_building["businesshours"].append(businesshours_entry)

        rocket_meals_data.append(new_building)

    return rocket_meals_data

def main(file_path):
    with open(file_path, 'r') as f:
        swosy_data = json.load(f)

    rocket_meals_data = parse_swosy_to_rocket_meals(swosy_data)

    output_file_path = "swosy_parsed_buildings_json_for_rocket_meals_json.json"
    with open(output_file_path, 'w') as f:
        json.dump(rocket_meals_data, f, indent=4)

    print(f"Parsed data has been saved to {output_file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 script.py path_to_swosy_json")
    else:
        # Canonicalize the CLI-controlled path (resolves "..", symlinks) and validate that
        # it stays inside the repository before it is opened.
        main(require_inside_base_dir(sys.argv[1]))
