export interface FoodParserInterface {

    createNeededData(): Promise<void>;

    getCanteensJSONList(): Promise<any>;

    getMealsJSONList(): Promise<any>;

    getMarkingExternalIdentifierListForFoodJSON(foodJSON: any): Promise<any>;

    getMealNutritionsForMealJSON(foodJSON: any): Promise<any>;

    getMealNutritionsForRawMealOffer(rawMealOffer: any): Promise<any>;

    getAliasForMealOfferFromRawMealOffer(rawMealOffer: any): Promise<any>;

    getRawMealOffersJSONList(): Promise<any>;

    getCanteenLabelFromRawMealOffer(rawMealOffer: any): Promise<any>;

    getMealIdFromRawMealOffer(rawMealOffer: any): Promise<any>;

    getISODateStringOfMealOffer(rawMealOffer: any): Promise<any>;

    getPriceForGroupFromRawMealOffer(group: string, rawMealOffer: any): Promise<any>;

    getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer: any): Promise<any>;

}
