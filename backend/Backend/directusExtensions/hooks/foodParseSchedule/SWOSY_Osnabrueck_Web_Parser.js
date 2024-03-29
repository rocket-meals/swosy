import {SWOSY_Web_Parser} from "./SWOSY_Web_Parser.js"; // in directus we need to add the filetype ... otherwise we get an error

export class SWOSY_Osnabrueck_Web_Parser {

    swosy_parser = null;

    constructor() {
        this.swosy_parser = new SWOSY_Web_Parser("https://swosy.sw-os.de:3001/api", 8)
    }

    async createNeededData(services, database, logger){
        return await this.swosy_parser.createNeededData(services, database, logger);
    }

    async getAliasForMealOfferFromRawMealOffer(rawMealOffer){
        return await this.swosy_parser.getAliasForMealOfferFromRawMealOffer(rawMealOffer);
    }

    async getMarkingsJSONList(){
        return await this.swosy_parser.getMarkingsJSONList();
    }

    async getCanteensJSONList(){
        return await this.swosy_parser.getCanteensJSONList();
    }

    async getMealsJSONList(){
        return await this.swosy_parser.getMealsJSONList();
    }

    async getMarkingLabelsForMealJSON(foodJSON){
        return await this.swosy_parser.getMarkingLabelsForMealJSON(foodJSON);
    }

    async getMealNutritionsForMealJSON(foodJSON){
        return await this.swosy_parser.getMealNutritionsForMealJSON(foodJSON);
    }

    async getMealOffersISOStringDatesToDelete(){
        return await this.swosy_parser.getMealOffersISOStringDatesToDelete();
    }

    async getRawMealOffersJSONList(){
        return await this.swosy_parser.getRawMealOffersJSONList();
    }

    async getCanteenLabelFromRawMealOffer(rawMealOffer){
        return await this.swosy_parser.getCanteenLabelFromRawMealOffer(rawMealOffer);
    }

    async getMealIdFromRawMealOffer(rawMealOffer){
        return await this.swosy_parser.getMealIdFromRawMealOffer(rawMealOffer);
    }

    async getISODateStringOfMealOffer(rawMealOffer){
        return await this.swosy_parser.getISODateStringOfMealOffer(rawMealOffer);
    }

    async getPriceForGroupFromRawMealOffer(group, rawMealOffer){
        return await this.swosy_parser.getPriceForGroupFromRawMealOffer(group, rawMealOffer);
    }

    async getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer){
        return await this.swosy_parser.getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer);
    }

}
