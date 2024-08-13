import moment from "moment";
import {CSVExportParser} from "./CSVExportParser"

import {FoodParserInterface, FoodsInformationTypeForParser, FoodWithBasicData} from "./FoodParserInterface";
import {FoodTL1Parser_GetRawReportInterface} from "./FoodTL1Parser_GetRawReportInterface";
import {LanguageCodes, TranslationHelper, TranslationsFromParsingType} from "../helpers/TranslationHelper";
import {PriceGroups} from "./PriceGroups";

const _FOODOFFERITEM_FOOD_ID = "food_id";
const _MEALOFFERITEM_ITEM = "raw_foodoffer_item";
const _MEALOFFERITEM_DATE = "date";
const _MEALOFFERITEM_CANTEEN_LABEL = "canteen_label";

type MealofferIdentifierType = string
type RawFoodofferJSONType = {
    [_FOODOFFERITEM_FOOD_ID]: string,
    [_MEALOFFERITEM_ITEM]: { [x: string]: string; },
    [_MEALOFFERITEM_DATE]: string,
    [_MEALOFFERITEM_CANTEEN_LABEL]: string
}


type RawFoodofferJSONListType = RawFoodofferJSONType[] | null

export class FoodTL1Parser implements FoodParserInterface {

    static DEFAULT_CANTEEN_FIELD = "MENSA";
    static DEFAULT_DATE_FIELD = "DATUM";
    static DEFAULT_TEXT_FIELD = "TEXT";
    static DEFAULT_RECIPE_ID_FIELD = "REZEPTUR_ID";
    static DEFAULT_NUTRITIONS_FIELD = "NAEHRWERTEJEPORT";
    static DEFAULT_CATEGORY_FIELD = "SPEISE";

    static FIELD_PRICE_STUDENT_OSNABRUECK = "STD_PREIS";
    static FIELD_PRICE_STUDENT_HANNOVER = "PREIS_STUDENT"; // Hannover TL1 specific

    static FIELD_PRICE_EMPLOYEE_OSNABRUECK = "BED_PREIS";
    static FIELD_PRICE_EMPLOYEE_HANNOVER = "PREIS_BEDIENSTETER"; // Hannover TL1 specific

    static FIELD_PRICE_GUEST_OSNABRUECK = "GÄSTE_PREIS";
    static FIELD_PRICE_GUEST_HANNOVER = "PREIS_GAST"; // Hannover TL1 specific

    static DEFAULT_MARKING_LABELS_FIELD = "ZSNUMMERN";
    static DEFAULT_MARKING_NAMES_FIELD = "ZSNAMEN";

    rawFoodoffersJSONList: RawFoodofferJSONListType = null;
    private rawFoodofferReader: FoodTL1Parser_GetRawReportInterface;

    constructor(rawFoodofferReader: FoodTL1Parser_GetRawReportInterface) {
        this.rawFoodofferReader = rawFoodofferReader;
        this.resetData()
    }

    private resetData(){
        this.rawFoodoffersJSONList = null;
    }

    public async createNeededData(){
        this.resetData()

        let rawReport = await this.rawFoodofferReader.getRawReport();
        this.rawFoodoffersJSONList = await FoodTL1Parser.createRawFoodofferJSONList(rawReport);
    }

    async getFoodsListForParser(){
        let foodIdToRawMealOfferDict = FoodTL1Parser.getFoodIdToRawFoodofferDict(this.rawFoodoffersJSONList);
        let foodIds = Object.keys(foodIdToRawMealOfferDict);
        let foodsJSONList: FoodsInformationTypeForParser[] = [];
        for(let foodId of foodIds){
            let rawMealOffer = foodIdToRawMealOfferDict[foodId];
            if(!!rawMealOffer){
                let food = FoodTL1Parser.getMealJSONFromRawMealOffer(rawMealOffer);
                if(!!food){
                    foodsJSONList.push(food);
                }
            }
        }
        return foodsJSONList;
    }

    async getCanteensList(){
        let rawMealOffers = await this.getFoodoffersForParser();
        let canteenLabelsDict = {};
        for(let rawMealOffer of rawMealOffers){
            let parsedReportItem = FoodTL1Parser.getParsedReportItemFromRawMealOffer(rawMealOffer);
            let canteenLabel = FoodTL1Parser.getCanteenLabelFunction(parsedReportItem);
            canteenLabelsDict[canteenLabel] = {
                label: canteenLabel,
                external_identifier: canteenLabel,
            };
        }
        return FoodTL1Parser.getValueListFromDict(canteenLabelsDict);
    }

    async getMealNutritionsForRawMealOffer(rawMealOffer){
        return FoodTL1Parser.getMealNutritionsFromRawMealOffer(rawMealOffer);
    }

    async getFoodoffersForParser(){
        return this.rawFoodoffersJSONList;
    }

    async getCanteenExternalIdentifierFromRawMealOffer(rawMealOffer){
        return rawMealOffer[FoodTL1Parser._MEALOFFERITEM_CANTEEN_LABEL];
    }

    async getMealIdFromRawMealOffer(rawMealOffer){
        return rawMealOffer[FoodTL1Parser._FOODOFFERITEM_FOOD_ID]
    }

    async getISODateStringOfMealOffer(rawMealOffer){
        return rawMealOffer[FoodTL1Parser._MEALOFFERITEM_DATE];
    }

    async getPriceForGroupFromRawMealOffer(group: string, rawMealOffer){
        let parsedReportItem = FoodTL1Parser.getParsedReportItemFromRawMealOffer(rawMealOffer);
        return FoodTL1Parser.getPriceForGroup(parsedReportItem, group)
    }

    async getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer){
        return FoodTL1Parser.getMealOfferMarkingLabelsFromRawMealOffer(rawMealOffer);
    }

    /**
     * Parser for TL1 Reports
     */

    static _FOODOFFERITEM_FOOD_ID = _FOODOFFERITEM_FOOD_ID
    static _MEALOFFERITEM_ITEM = _MEALOFFERITEM_ITEM
    static _MEALOFFERITEM_DATE = _MEALOFFERITEM_DATE
    static _MEALOFFERITEM_CANTEEN_LABEL = _MEALOFFERITEM_CANTEEN_LABEL

    static async createRawFoodofferJSONList(rawReport: string | Buffer | undefined): Promise<RawFoodofferJSONListType> {
        let parsedReportAsJsonList = CSVExportParser.getListOfLineObjects(rawReport, CSVExportParser.NEW_LINE_DELIMITER, CSVExportParser.INLINE_DELIMITER_TAB, true);
        let groupedReportItems = FoodTL1Parser._groupParsedReportItemsToMealOfferListsItems(parsedReportAsJsonList);
        return FoodTL1Parser.getRawFoodofferJSONListFromGroupedList(groupedReportItems);
    }

    /**
     * In the report there are multiple lines for one meal offer. These lines contain the same meal offer identifier but have different meal ingredient ids
     * For example:
     * [
     *  { // One line parsed where SPEISE_ID 253 is for Quark
     *      "MENSA": "Mensa Haste",
     *      "DATUM": "25.01.2022",
     *      "TEXT1": "Quark (20,g)",
     *      "TEXT2": "Erdbeersauce",
     *      "SPEISE_ID": "253",
     *  },
     * { // One line parsed where SPEISE_ID 999 is for Erdbeersauce
     *      "MENSA": "Mensa Haste",
     *      "DATUM": "25.01.2022",
     *      "TEXT1": "Quark (20,g)",
     *      "TEXT2": "Erdbeersauce",
     *      "SPEISE_ID": "999",
     *  },
     *  So we want to group these lines to one meal offer as our Identifier (MENSA, DATUM, TEXT1, TEXT2) is the same
     * @param parsedReportAsJsonList
     */
    static _groupParsedReportItemsToMealOfferListsItems(parsedReportAsJsonList: {[p: string]: string }[]): {[p: MealofferIdentifierType]: {[p: string]: string }[]} {
        let dictOfItemsForAMealOffer: {[p: MealofferIdentifierType]: {[p: string]: string }[]} = {};
        for(let item of parsedReportAsJsonList){
            let identifier: MealofferIdentifierType | null = FoodTL1Parser.getMealOfferIdentifier(item);
            if(!!identifier){
                let listOfParsedItemsForSameMealOffer = dictOfItemsForAMealOffer[identifier] || [];
                listOfParsedItemsForSameMealOffer.push(item);
                dictOfItemsForAMealOffer[identifier] = listOfParsedItemsForSameMealOffer;
            }
        }
        return dictOfItemsForAMealOffer;
    }

    static getRawFoodofferJSONListFromGroupedList(groupedReportItems: {[p: MealofferIdentifierType]: {[p: string]: string }[]}): RawFoodofferJSONListType {
        let foodOfferJSONList: RawFoodofferJSONType[] = [];
        let keys: MealofferIdentifierType[] = Object.keys(groupedReportItems) as MealofferIdentifierType[];
        for(let key of keys){
            let listOfItemsForSameFoodoffer = groupedReportItems[key];
            let foodOfferJSON = FoodTL1Parser.getRawFoodofferFromGroupedItems(listOfItemsForSameFoodoffer);
            if(!!foodOfferJSON){
                foodOfferJSONList.push(foodOfferJSON);
            }
        }
        return foodOfferJSONList;
    }

    static getRawFoodofferFromGroupedItems(listOfItemsForSameMealOffer: {[p: string]: string }[] | undefined): RawFoodofferJSONType | null{

        if(!listOfItemsForSameMealOffer || listOfItemsForSameMealOffer.length === 0){
            return null;
        }
        let parsedReportItem = listOfItemsForSameMealOffer[0];
        if(!parsedReportItem){
            return null;
        }

        let recipe_ids: string[] = [];
        for(let item of listOfItemsForSameMealOffer){
            let item_id = FoodTL1Parser.getRecipeIdFunction(item);
            recipe_ids.push(item_id);
        }
        let food_id = FoodTL1Parser.getSortedMealId(recipe_ids);
        let date = FoodTL1Parser.getISODateFunction(parsedReportItem)
        let canteen_label = FoodTL1Parser.getCanteenLabelFunction(parsedReportItem)

        return {
            [_FOODOFFERITEM_FOOD_ID]: food_id,
            [_MEALOFFERITEM_ITEM]: parsedReportItem,
            [_MEALOFFERITEM_DATE]: date,
            [_MEALOFFERITEM_CANTEEN_LABEL]: canteen_label,
        };
    }

    /**
     * sorting the MealIds in ascending order
     * @param string_recipe_ids the String to be sorted
     * @returns {string} returns the sorted MealIds as a string with - as a delimiter
     */
    static getSortedMealId(string_recipe_ids: string[]){
        let numbers = string_recipe_ids.map(Number);
        let uniques = [...new Set(numbers)].map(Number).sort(function(a, b) {return a-b});
        return uniques.map(String).join("-");
    }

    /**
     *
     */

    static getFoodIdToRawFoodofferDict(rawFoodofferJSONList: RawFoodofferJSONListType){
        let foodIdsDictToRawMealOffers: { [x: string]: RawFoodofferJSONType; } = {};
        if(!!rawFoodofferJSONList){
            for(let rawFoodoffer of rawFoodofferJSONList){
                let foodId = FoodTL1Parser.getFoodIdFromRawFoodoffer(rawFoodoffer);
                if(!!foodId){
                    foodIdsDictToRawMealOffers[foodId] = rawFoodoffer;
                }
            }
        }
        return foodIdsDictToRawMealOffers
    }

    static getMealJSONFromRawMealOffer(rawMealOffer: RawFoodofferJSONType): FoodsInformationTypeForParser | null {
        const meal_id = FoodTL1Parser.getFoodIdFromRawFoodoffer(rawMealOffer);
        if(!meal_id){
            return null;
        }

        let parsedReportItem = rawMealOffer[FoodTL1Parser._MEALOFFERITEM_ITEM];

        const translations: TranslationsFromParsingType = {
            [LanguageCodes.DE]: {"name": FoodTL1Parser._getMealNameDe(parsedReportItem)},
            [LanguageCodes.EN]: {"name": FoodTL1Parser._getMealNameEn(parsedReportItem)}
        };

        const basicFoodData: FoodWithBasicData = {
            id: meal_id,
            alias: FoodTL1Parser._getMealNameDe(parsedReportItem),
            category: parsedReportItem?.[FoodTL1Parser.DEFAULT_CATEGORY_FIELD],
        }

        const result: FoodsInformationTypeForParser = {
            basicFoodData: basicFoodData,
            translations: translations,
        }

        return {
            id: meal_id,
            alias: FoodTL1Parser._getMealNameDe(parsedReportItem),
            category: parsedReportItem[FoodTL1Parser.DEFAULT_CATEGORY_FIELD],
//            name: TL1Parser._getMealName(parsedReportItem),
            translations: {
                [TranslationHelper.LANGUAGE_CODE_DE]: {"name": FoodTL1Parser._getMealNameDe(parsedReportItem)},
                [TranslationHelper.LANGUAGE_CODE_EN]: {"name": FoodTL1Parser._getMealNameEn(parsedReportItem)}
            }
        };
    }

    async getAliasForMealOfferFromRawMealOffer(rawMealOffer){
        let parsedReportItem = rawMealOffer[FoodTL1Parser._MEALOFFERITEM_ITEM];
        return FoodTL1Parser._getMealNameDe(parsedReportItem);
    }

    static getParsedReportItemFromRawMealOffer(rawMealOffer){
        return rawMealOffer[FoodTL1Parser._MEALOFFERITEM_ITEM];
    }

    static getFoodIdFromRawFoodoffer(rawMealOffer: RawFoodofferJSONType){
        return rawMealOffer[FoodTL1Parser._FOODOFFERITEM_FOOD_ID];
    }

    static _hasValidName(parsedReportItem){
        let rawNamesList = FoodTL1Parser._getRawNamesList(parsedReportItem);
        if(!!rawNamesList && rawNamesList.length>0){
            let rawName = rawNamesList.join("");
            return rawName.length > 0;
        } else {
            return false;
        }
    }

    static getMealOfferIdentifier(parsedReportItem: { [p: string]: string }): MealofferIdentifierType | null {
        if(FoodTL1Parser._hasValidName(parsedReportItem)){
            let mealOfferIdentifier = "";
            mealOfferIdentifier += FoodTL1Parser._getCanteenName(parsedReportItem)
            mealOfferIdentifier += FoodTL1Parser._getDatum(parsedReportItem)
            mealOfferIdentifier += FoodTL1Parser._getMealIdentifier(parsedReportItem)
            return mealOfferIdentifier as MealofferIdentifierType;
        } else {
            return null;
        }
    }

    static getRecipeIdFunction(parsedReportItem) {
        return parsedReportItem[FoodTL1Parser.DEFAULT_RECIPE_ID_FIELD];
    }

    static getISODateFunction(parsedReportItem){
        /**
         *   "DATUM": "25.01.2022",
         */
        let rawDate = FoodTL1Parser._getDatum(parsedReportItem);
        let isoDate = moment(rawDate, "DD-MM-YYYY");
        return isoDate.toISOString();
    }

    static getCanteenLabelFunction(parsedReportItem){
        return parsedReportItem[FoodTL1Parser.DEFAULT_CANTEEN_FIELD];
    }

    static findFirstPriceValueForFields(parsedReportItem, fields: string[]){
        for(let field of fields){
            let value = parsedReportItem[field];
            if(!!value){
                return value;
            }
        }
        return null;
    }

    static getPriceForGroup(parsedReportItem, groupName: string){
        let foundPrice = null;
        switch (groupName){
            case PriceGroups.PRICE_GROUP_STUDENT: foundPrice = FoodTL1Parser.findFirstPriceValueForFields(parsedReportItem, [FoodTL1Parser.FIELD_PRICE_STUDENT_OSNABRUECK, FoodTL1Parser.FIELD_PRICE_STUDENT_HANNOVER]); break;
            case PriceGroups.PRICE_GROUP_EMPLOYEE: foundPrice = FoodTL1Parser.findFirstPriceValueForFields(parsedReportItem, [FoodTL1Parser.FIELD_PRICE_EMPLOYEE_OSNABRUECK, FoodTL1Parser.FIELD_PRICE_EMPLOYEE_HANNOVER]); break;
            case PriceGroups.PRICE_GROUP_GUEST: foundPrice = FoodTL1Parser.findFirstPriceValueForFields(parsedReportItem, [FoodTL1Parser.FIELD_PRICE_GUEST_OSNABRUECK, FoodTL1Parser.FIELD_PRICE_GUEST_HANNOVER]); break;
            default: return null
        }
        if(!!foundPrice){
            /**
             *    "STD_PREIS": "0,50",
             */
            foundPrice = foundPrice.replace(",", ".");
        }
        return foundPrice;

    }


    /**
     * Nutritions
     */

    static getMealNutritionsFromRawMealOffer(rawMealOffer){
        /**
         * e. G.
         * "NAEHRWERTEJEPORT": "Brennwert=612 kJ (146 kcal), Fett=1,1g, davon gesättigte Fettsäuren=0,6g, Kohlenhydrate=19,8g, davon Zucker=18,8g, Ballaststoffe=0,0g, Eiweiß=12,8g, Salz=0,1g,"
         */
        let parsedReportItem = FoodTL1Parser.getParsedReportItemFromRawMealOffer(rawMealOffer);
        let nutritionValuesJSON = {};
        let nutritionValuesString = parsedReportItem[FoodTL1Parser.DEFAULT_NUTRITIONS_FIELD];
        if(!!nutritionValuesString){
            let kcalEndString = " kcal)";
            let match = nutritionValuesString.match(/\(.* kcal/gm);
            // e. G. (XXXXXXX kcal)
            if(!!match){
                let kcal = match[0].slice(1,kcalEndString.length); //remove starting bracket "(" and kcal)
                nutritionValuesJSON.calories_kcal = parseInt(kcal);
            }

            let fatInGrams = FoodTL1Parser.parseNutritionValue(nutritionValuesString,"Fett");
            nutritionValuesJSON.fat_g = fatInGrams;

            let saturatedFatInGrams = FoodTL1Parser.parseNutritionValue(nutritionValuesString,"Fettsäuren");
            nutritionValuesJSON.saturated_fat_g = saturatedFatInGrams;

            let carbohydratesInGrams = FoodTL1Parser.parseNutritionValue(nutritionValuesString,"Kohlenhydrate");
            nutritionValuesJSON.carbohydrate_g = carbohydratesInGrams;

            let sugarInGrams = FoodTL1Parser.parseNutritionValue(nutritionValuesString,"Zucker");
            nutritionValuesJSON.sugar_g = sugarInGrams;

            let fiberInGrams = FoodTL1Parser.parseNutritionValue(nutritionValuesString,"Ballaststoffe");
            nutritionValuesJSON.fiber_g = fiberInGrams;

            let proteinInGrams = FoodTL1Parser.parseNutritionValue(nutritionValuesString,"Eiweiß");
            nutritionValuesJSON.protein_g = proteinInGrams;

            let saltInGrams = FoodTL1Parser.parseNutritionValue(nutritionValuesString,"Salz");
            nutritionValuesJSON.sodium_g = saltInGrams;
        }
        return nutritionValuesJSON;
    }

    static parseFloatWithOneDecimal(str) {
        let num = parseFloat(str);
        if (isNaN(num)) {
            return NaN; // or some other value to indicate the parse failed
        }
        return Math.round(num * 10) / 10;
    }

    static parseNutritionValue(nutritionValuesString,searchValue){
        try{
            let searchText = searchValue+"=";
            let regex = new RegExp(searchText+"\\d*,\\d*","gm");
            let match = nutritionValuesString.match(regex);
            if(!!match && match.length === 1){
                let matchString = match[0];
                let valueString = matchString.slice(searchText.length);
                valueString = valueString.replace(",",".");
                let value = FoodTL1Parser.parseFloatWithOneDecimal(valueString);
                return value;
            }
        } catch(err){
            return null;
        }
        return null;
    }

    /**
     *
     */

    static getMealOfferMarkingLabelsFromRawMealOffer(rawMealOffer){
        let parsedReportItem = FoodTL1Parser.getParsedReportItemFromRawMealOffer(rawMealOffer);
        let markingsDict = {};
        let rawName = FoodTL1Parser._getRawNamesList(parsedReportItem).join("");
        markingsDict = FoodTL1Parser.getMarkingLabelsDictFromName(rawName);
        return Object.keys(markingsDict);
    }

    static getMarkingLabelsDictFromName(name){
        let markingsDict = {};
        //e. G. "Strawberries (g, b) with Cream (2)"
        let rawMarkingsInName = name.match(/\([^\)]+\)/gm); //http://regex.inginf.units.it/
        //e. G. ["(g, b)", "(2)"]
        if(!!rawMarkingsInName){
            for(let rawMarkingsPart of rawMarkingsInName){
                //e. G. "(g, b)"
                let listOfPartMarkings = FoodTL1Parser.removeValuesAndWhitespacesAndSeperators(rawMarkingsPart, ["(", ")"], ",");
                //e. G. ["g", "b"]
                for (let partMarking of listOfPartMarkings) {
                    markingsDict[partMarking] = partMarking;
                }
            }
        }
        //transform dict into list
        return markingsDict;
    }

    static removeValuesAndWhitespacesAndSeperators(string, valuesToRemove, seperator){
        //e. G. string is "(g, b)"  valuesToRemove ["(", ")"]   seperator ","
        let output = [];
        let workingString = new String(string);
        //remove values
        for(let value of valuesToRemove){
            workingString = workingString.replace(value, "");
        }
        //e. G. "(g, b)"
        let splits = workingString.split(seperator);
        //e. G. ["g", " b"]
        for(let split of splits){
            output.push(split.trim()); //removed whitespaces e. G. " b" --> "b"
        }
        //e. G. ["g", "b"]
        return output;
    }

    /**
     *
     {
      "MENSA": "Mensa Haste",
      "DATUM": "25.01.2022",
      "VK-ArtikelNr": "2097",
      "VK-GebindeNR": "3666",
      "SPEISE": "Dessert 2",
      "SPEISE_BEZEICHNUNG": "Dessert",
      "REZEPTUR_ID": "253",
      "TEXT1": "Quark (20,g)",
      "TEXT2": "Erdbeersauce",
      "TEXT3": "",
      "TEXT4": "",
      "TEXT5": "",
      "TEXT6": "",
      "TEXT1_1": "Quark dessert (20,g)",
      "TEXT2_1": "Strawberry sauce",
      "TEXT3_1": "",
      "TEXT4_1": "",
      "TEXT5_1": "",
      "TEXT6_1": "",
      "STD_PREIS": "0,50",
      "BED_PREIS": "1,00",
      "GÄSTE_PREIS": "1,20",
      "FREI1": "c",
      "FREI2": "",
      "FREI3": "",
      "ZSNUMMERN": "20, g, 0",
      "ZSNAMEN": "vegetarisch, Milch und Laktose (g), zusatzstoff- und allergenfrei",
      "NAEHRWERTEJE100G": "-",
      "NAEHRWERTEJEPORT": "Brennwert=612 kJ (146 kcal), Fett=1,1g, davon gesättigte Fettsäuren=0,6g, Kohlenhydrate=19,8g, davon Zucker=18,8g, Ballaststoffe=0,0g, Eiweiß=12,8g, Salz=0,1g,"
    },
     */


    static _getCanteenName(parsedReportItem) {
        return parsedReportItem[FoodTL1Parser.DEFAULT_CANTEEN_FIELD];
    }

    static _getDatum(parsedReportItem) {
        return parsedReportItem[FoodTL1Parser.DEFAULT_DATE_FIELD];
    }

    static _getMealIdentifier(parsedReportItem) {
        return FoodTL1Parser._getRawNamesList(parsedReportItem).join("");
    }

    static _getRawNamesList(parsedReportItem, postFieldName){
        if(!postFieldName){
            postFieldName = "";
        }
        let meal_partials_names = [];
        for(let i=1; i<= 6; i++){
            let partialName = parsedReportItem[FoodTL1Parser.DEFAULT_TEXT_FIELD+i+postFieldName];
            if(!!partialName && partialName.length>0 && partialName!==" "){
                meal_partials_names.push(partialName);
            }
        }
        return meal_partials_names;
    }



    static _getMealNameDe(parsedReportItem){
        let rawMealName = FoodTL1Parser._getRawNamesList(parsedReportItem, "").join(", ");
        return rawMealName.replace(/ \([^ ]+/gm, ""); //remove all (1,3,) stuff
    }

    static _getMealNameEn(parsedReportItem){
        let rawMealName = FoodTL1Parser._getRawNamesList(parsedReportItem, "_1").join(", ");
        return rawMealName.replace(/ \([^ ]+/gm, ""); //remove all (1,3,) stuff
    }

    /**
     *
     */

    static getValueListFromDict(dict){
        let keys = Object.keys(dict);
        let values = [];
        for(let key of keys){
            values.push(dict[key]);
        }
        return values;
    }

}
