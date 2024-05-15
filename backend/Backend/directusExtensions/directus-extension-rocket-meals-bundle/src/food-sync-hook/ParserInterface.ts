export interface ParserInterface {

    createNeededData(): Promise<void>;

    getMarkingsJSONList(): Promise<any>;

    getCanteensJSONList(): Promise<any>;

    getMealsJSONList(): Promise<any>;

    getMarkingLabelsForMealJSON(foodJSON: any): Promise<any>;

    getMealNutritionsForMealJSON(foodJSON: any): Promise<any>;

    getMealNutritionsForRawMealOffer(rawMealOffer: any): Promise<any>;

    getAliasForMealOfferFromRawMealOffer(rawMealOffer: any): Promise<any>;

    getMealOffersISOStringDatesToDelete(): Promise<any>;

    getRawMealOffersJSONList(): Promise<any>;

    getCanteenLabelFromRawMealOffer(rawMealOffer: any): Promise<any>;

    getMealIdFromRawMealOffer(rawMealOffer: any): Promise<any>;

    getISODateStringOfMealOffer(rawMealOffer: any): Promise<any>;

    getPriceForGroupFromRawMealOffer(group: string, rawMealOffer: any): Promise<any>;

    getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer: any): Promise<any>;

}
