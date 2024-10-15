import requests
import markdown2
from fpdf import FPDF

# variable for server endpoint

# Example variables
SERVER_ENDPOINT = "https://swosy.rocket-meals.de/rocket-meals/api/items"

# Predefined Server Endpoints
predefinedOptions = {
    "1": "Current HTTPS",
    "2": "Test Server",
    "3": "Studi|Futter",
    "4": "SWOSY"
}

serverEndpoints = {
    "Current HTTPS": "https://swosy.rocket-meals.de/rocket-meals/api",
    "Test Server": "https://test.rocket-meals.de/rocket-meals/api",
    "Studi|Futter": "https://studi-futter.rocket-meals.de/rocket-meals/api",
    "SWOSY": "https://swosy.rocket-meals.de/rocket-meals/api"
}

def select_server_endpoint():
    print("Please select a server endpoint from the following options:")
    for key, name in predefinedOptions.items():
        print(f"{key}. {name} ({serverEndpoints[name]})")
    print("5. Enter a custom server URL")

    # Ask the user to select an option or enter their own URL
    choice = input("Enter the number of your choice (1-5): ")

    if choice in predefinedOptions:
        selected_option = predefinedOptions[choice]
        print(f"Selected server: {selected_option}")
        return serverEndpoints[selected_option]
    elif choice == "5":
        custom_url = input("Enter the custom server URL: ")
        return custom_url
    else:
        print("Invalid choice. Please try again.")
        return select_server_endpoint()

def create_markdown_instruction_get_canteens():
    # {SERVER_ENDPOINT}/items/canteens?limit=-1
    # call the endpoint and ask the user interactively to select the canteen

    # make a GET request to the endpoint
    URL = f"{SERVER_ENDPOINT}/canteens?limit=-1"
    response = requests.get(URL)
    data = response.json()
    print(data)
    


    # and to select the date range, predefined would be today in format YYYY-MM-DD but MM as 10 for October


def create_markdown_instruction_get_foodoffers_with_image(EXAMPLE_CANTEEN_ID, DATE_START, DATE_END):
    # https://swosy.rocket-meals.de/rocket-meals/api/items/foodoffers?fields=*,food.*,!food.feedbacks,food.translations.*,markings.*&filter={"_and":[{"_or":[{"_and":[{"date":{"_gte":"2024-10-16"}},{"date":{"_lte":"2024-10-16"}}]},{"date":{"_null":true}}]},{"canteen":{"_eq":<MENSA_ID>}}]}&limit=-1
    # call the endpoint and get the data
    # example_data = {
    #                                 "data": [
    #                                                {
    #                                                                "id": "35c91e2d-db0d-4b7d-8ab4-be0fc729c53b",
    #                                                                "food": {
    #                                                                                "id": "25554-4654",
    #                                                                                "alias": "Hot Dog",
    #                                                                                "image_remote_url": null,
    #                                                                                "image": "ba2e4e89-28f8-4707-91f7-70740a6db841"
    #                                                                },
    #                                                                ….
    #                                                },
    #                                                ...
    #                                 ]
    #                 }


def create_markdown_instruction_get_image(EXAMPLE_IMAGE_ID):
    # https://swosy.rocket-meals.de/rocket-meals/api/assets/<IMAGE_ID>?fit=cover&width=512&height=512&quality=100
    # optional parameters can be more read here: https://docs.directus.io/reference/files.html#custom-transformations


def create_markdown_instruction():


def generate_pdf_instruction_from_markdown(markdown_instruction):
    # Generate pdf from markdown
    # Return path to pdf file
    pass

if __name__ == "__main__":
    # Select the server endpoint
    SERVER_ENDPOINT = select_server_endpoint()

    # Create markdown instruction
    markdown_instruction = create_markdown_instruction()

    # Generate PDF instruction from markdown
    pdf_file_path = generate_pdf_instruction_from_markdown(markdown_instruction)

    print(f"PDF instruction generated successfully at {pdf_file_path}")
