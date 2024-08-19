import {Canteens, Foodoffers, Foods} from "../databaseTypes/types";
import {TranslationsFromParsingType} from "../helpers/TranslationHelper";


// Remove all fields with relation to other tables
export type FoodWithBasicData = Omit<Foods, "user_created" | "user_updated" | "markings" | "image" | "feedbacks" | "translations" | "environmental_impact" | "nutrition" | "rating_legacy_settings" | "rating_settings">;
export type FoodWithBasicDataWithoutIdType = Omit<FoodWithBasicData, "id">

export type FoodsInformationTypeForParser = {
    basicFoodData: FoodWithBasicData,
    marking_external_identifiers: string[],
    translations: TranslationsFromParsingType
}

// Remove all fields with relation to other tables
type CanteenTypeOmitedFields = Omit<Canteens, "id" | "user_created" | "user_updated" | "building" | "foodservice_hours" | "utilization_group">;
export type CanteensTypeForParser = CanteenTypeOmitedFields & {external_identifier: string}; // make external_identifier required

export type FoodofferDateType = {
    year: number, // e.g. 2021
    month: number, // 01-12
    day: number // 01-31
}
export type FoodofferTypeWithBasicData = Omit<Foodoffers, "id" | "user_created" | "user_updated" | "canteen" | "food" | "markings" | "date" | "environmental_impact" | "nutrition" | "prices">;
export type FoodoffersTypeForParser = {
    basicFoodofferData: FoodofferTypeWithBasicData,
    marking_external_identifiers: string[]
    date: FoodofferDateType
    canteen_external_identifier: string,
    food_id: string
}


export type FoodofferTypeForCreation = FoodofferTypeWithBasicData & {
    date: string, // in the format "YYYY-MM-DD" e.g. "2021-01-01" where month 01 is January
    canteen: string, // we require the primary key of the canteen
    food: string // we require the primary key of the food
};

export interface FoodParserInterface {

    /**
     * This method should create the needed data for the parser to work on every call of the parser.
     */
    createNeededData(): Promise<void>;

    /**
     * This method should return the list of all canteens
     */
    getCanteensList(): Promise<CanteensTypeForParser[]>;

    /**
     * This method should return the list of all foods
     */
    getFoodsListForParser(): Promise<FoodsInformationTypeForParser[]>;

    /**
     * This method should return the list of all foodoffers
     */
    getFoodoffersForParser(): Promise<FoodoffersTypeForParser[]>;

}
