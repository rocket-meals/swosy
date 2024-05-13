export interface TL1ParserInterface {

    createNeededData(services, database, logger): Promise<void>;

    etMarkingsJSONList(): Promise<any>;

    getCanteensJSONList(): Promise<any>;

    getMealsJSONList(): Promise<any>;

    getMarkingLabelsForMealJSON(foodJSON): Promise<any>;

    getMealNutritionsForMealJSON(foodJSON): Promise<any>;

    getMealNutritionsForRawMealOffer(rawMealOffer): Promise<any>;

    getAliasForMealOfferFromRawMealOffer(rawMealOffer): Promise<any>;

    getMealOffersISOStringDatesToDelete(): Promise<any>;

    getRawMealOffersJSONList(): Promise<any>;

    getCanteenLabelFromRawMealOffer(rawMealOffer): Promise<any>;

    getMealIdFromRawMealOffer(rawMealOffer): Promise<any>;

    getISODateStringOfMealOffer(rawMealOffer): Promise<any>;

    getPriceForGroupFromRawMealOffer(group, rawMealOffer): Promise<any>;

    getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer): Promise<any>;

}
