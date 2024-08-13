import {Canteens, Foodoffers, Foods} from "../databaseTypes/types";
import {TranslationsFromParsingType} from "../helpers/TranslationHelper";


// Remove all fields with relation to other tables
export type FoodWithBasicData = Omit<Foods, "user_created" | "user_updated" | "markings" | "image" | "feedbacks" | "translations">;

export type FoodsInformationTypeForParser = {
    basicFoodData: FoodWithBasicData,
    marking_external_identifiers: string[],
    translations: TranslationsFromParsingType
}

// Remove all fields with relation to other tables
type CanteenTypeOmitedFields = Omit<Canteens, "id" | "user_created" | "user_updated" | "building" | "foodservice_hours" | "utilization_group">;
export type CanteensTypeForParser = CanteenTypeOmitedFields & {external_identifier: string}; // make external_identifier required

type FoodofferRequiredFields = {date: string}
type FoodofferTypeWithBasicData = Omit<Foodoffers, "id" | "user_created" | "user_updated" | "canteen" | "food" | "markings"> & FoodofferRequiredFields;
export type FoodoffersTypeForParser = {
    basicFoodofferData: FoodofferTypeWithBasicData,
    marking_external_identifiers: string[]
    canteen_external_identifier: string,
    food_id: string
}

export type FoodofferTypeForCreation = Omit<Foodoffers, "id" | "user_created" | "user_updated" | "canteen" | "markings"> & {
    date: string,
    canteen: string, // we require the primary key of the canteen
    food: string // we require the primary key of the food
};

export interface FoodParserInterface {

    createNeededData(): Promise<void>;

    getCanteensList(): Promise<CanteensTypeForParser[]>;

    getFoodsListForParser(): Promise<FoodsInformationTypeForParser[]>;

    getAliasForMealOfferFromRawMealOffer(rawMealOffer: any): Promise<any>;

    getFoodoffersForParser(): Promise<FoodoffersTypeForParser[]>;

    getISODateStringOfMealOffer(rawMealOffer: any): Promise<any>;

}
