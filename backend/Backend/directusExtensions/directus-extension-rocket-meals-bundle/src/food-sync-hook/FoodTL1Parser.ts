import moment from "moment";
import {CSVExportParser} from "./CSVExportParser"

import {FoodParserInterface} from "./FoodParserInterface";
import {FoodTL1Parser_GetRawReportInterface} from "./FoodTL1Parser_GetRawReportInterface";
import {ParseSchedule} from "./ParseSchedule";
import {TranslationHelper} from "../helpers/TranslationHelper";

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

    rawMealOffers: null | { [x: string]: any; }[]  = null;
    foodIdToRawMealOfferDict: null | { [x: string]: any; }[] = null;
    private rawMealOfferReader: FoodTL1Parser_GetRawReportInterface;

    constructor(rawMealOfferReader: FoodTL1Parser_GetRawReportInterface) {
        this.rawMealOfferReader = rawMealOfferReader;
        this.rawMealOffers = null;
        this.foodIdToRawMealOfferDict = null;
    }

    async createNeededData(){
        let rawReport = await this.rawMealOfferReader.getRawReport();
        this.rawMealOffers = await FoodTL1Parser.createRawMealOffers(rawReport);
        this.foodIdToRawMealOfferDict = FoodTL1Parser.createMealIdToRawMealOfferDict(this.rawMealOffers);
    }

    async getMealsJSONList(){
        let foodIdToRawMealOfferDict = this.foodIdToRawMealOfferDict;
        let foodIds = Object.keys(foodIdToRawMealOfferDict);
        let foodsJSONList = [];
        for(let foodId of foodIds){
            let rawMealOffer = foodIdToRawMealOfferDict[foodId];
            let food = FoodTL1Parser.getMealJSONFromRawMealOffer(rawMealOffer);
            foodsJSONList.push(food);
        }
        return foodsJSONList;
    }

    async getCanteensJSONList(){
        let rawMealOffers = await this.getRawMealOffersJSONList();
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

    async getMarkingExternalIdentifierListForFoodJSON(foodJSON){
        let rawMealOffer = this._getRawMealOfferFromMealJSON(foodJSON);
        return FoodTL1Parser.getMealOfferMarkingLabelsFromRawMealOffer(rawMealOffer);
    }

    async getMealNutritionsForMealJSON(foodJSON){
        let rawMealOffer = this._getRawMealOfferFromMealJSON(foodJSON);
        return this.getMealNutritionsForRawMealOffer(rawMealOffer);
    }

    async getMealNutritionsForRawMealOffer(rawMealOffer){
        return FoodTL1Parser.getMealNutritionsFromRawMealOffer(rawMealOffer);
    }

    async getRawMealOffersJSONList(){
        return this.rawMealOffers;
    }

    async getCanteenLabelFromRawMealOffer(rawMealOffer){
        return rawMealOffer[FoodTL1Parser._MEALOFFERITEM_CANTEEN_LABEL];
    }

    async getMealIdFromRawMealOffer(rawMealOffer){
        return rawMealOffer[FoodTL1Parser._MEALOFFERITEM_MEAL_ID]
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

    static _MEALOFFERITEM_MEAL_ID = "id";
    static _MEALOFFERITEM_ITEM = "item";
    static _MEALOFFERITEM_DATE = "date";
    static _MEALOFFERITEM_CANTEEN_LABEL = "canteen_label";

    static async createRawMealOffers(rawReport: string | Buffer | undefined){
        let parsedReport = CSVExportParser.getListOfLineObjects(rawReport, CSVExportParser.NEW_LINE_DELIMITER, CSVExportParser.INLINE_DELIMITER_TAB, true);
        let groupedReportItems = FoodTL1Parser._groupParsedReportItemsToMealOfferListsItems(parsedReport);
        return FoodTL1Parser.createMealOfferJSONFromGroupedList(groupedReportItems);
    }

    static _groupParsedReportItemsToMealOfferListsItems(parsedReport){
        let dictOfItemsForAMealOffer = {};
        for(let item of parsedReport){
            let identifier = FoodTL1Parser.getMealOfferIdentifier(item);
            if(!!identifier){
                let listOfParsedItemsForSameMealOffer = dictOfItemsForAMealOffer[identifier] || [];
                listOfParsedItemsForSameMealOffer.push(item);
                dictOfItemsForAMealOffer[identifier] = listOfParsedItemsForSameMealOffer;
            }
        }
        return dictOfItemsForAMealOffer;
    }

    static createMealOfferJSONFromGroupedList(groupedReportItems){
        let foodOfferJSONList = [];
        let keys = Object.keys(groupedReportItems);
        for(let key of keys){
            let listOfItemsForSameMealOffer = groupedReportItems[key];
            let foodOfferJSON = FoodTL1Parser._createMealOfferFromGroupedItems(listOfItemsForSameMealOffer);
            foodOfferJSONList.push(foodOfferJSON);
        }
        return foodOfferJSONList;
    }

    static _createMealOfferFromGroupedItems(listOfItemsForSameMealOffer){
        let recipe_ids = [];
        let parsedReportItem = listOfItemsForSameMealOffer[0];
        for(let item of listOfItemsForSameMealOffer){
            let item_id = FoodTL1Parser.getRecipeIdFunction(item);
            recipe_ids.push(item_id);
        }
        let food_id = FoodTL1Parser.getSortedMealId(recipe_ids);

        let date = FoodTL1Parser.getISODateFunction(parsedReportItem)
        let canteen_label = FoodTL1Parser.getCanteenLabelFunction(parsedReportItem)

        return {
            [FoodTL1Parser._MEALOFFERITEM_MEAL_ID]: food_id,
            [FoodTL1Parser._MEALOFFERITEM_ITEM]: parsedReportItem,
            [FoodTL1Parser._MEALOFFERITEM_DATE]: date,
            [FoodTL1Parser._MEALOFFERITEM_CANTEEN_LABEL]: canteen_label,
        }
    }

    /**
     * sorting the MealIds in ascending order
     * @param string_recipe_ids the String to be sorted
     * @returns {string} returns the sorted MealIds as a string with - as a delimiter
     */
    static getSortedMealId(string_recipe_ids) {
        let numbers = string_recipe_ids.map(Number);
        let uniques = [...new Set(numbers)].map(Number).sort(function(a, b) {return a-b});
        return uniques.map(String).join("-");
    }

    /**
     *
     */

    static createMealIdToRawMealOfferDict(rawMealOffers){
        let foodIdsDictToRawMealOffers = {};
        for(let rawMealOffer of rawMealOffers){
            let foodId = FoodTL1Parser.getMealIdFromRawMealOffer(rawMealOffer);
            foodIdsDictToRawMealOffers[foodId] = rawMealOffer;
        }
        return foodIdsDictToRawMealOffers
    }

    _getRawMealOfferFromMealJSON(mealJSON){
        let mealId = mealJSON.id;
        return this.foodIdToRawMealOfferDict[mealId];
    }

    static getMealJSONFromRawMealOffer(rawMealOffer){
        let meal_id = FoodTL1Parser.getMealIdFromRawMealOffer(rawMealOffer);
        let parsedReportItem = rawMealOffer[FoodTL1Parser._MEALOFFERITEM_ITEM];
        //console.log("getMealJSONFromRawMealOffer", parsedReportItem)
        //console.log("category", parsedReportItem[FoodTL1Parser.DEFAULT_CATEGORY_FIELD])

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

    static getMealIdFromRawMealOffer(rawMealOffer){
        return rawMealOffer[FoodTL1Parser._MEALOFFERITEM_MEAL_ID];
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

    static getMealOfferIdentifier(parsedReportItem){
        if(FoodTL1Parser._hasValidName(parsedReportItem)){
            let mealOfferIdentifier = "";
            mealOfferIdentifier += FoodTL1Parser._getCanteenName(parsedReportItem)
            mealOfferIdentifier += FoodTL1Parser._getDatum(parsedReportItem)
            mealOfferIdentifier += FoodTL1Parser._getMealIdentifier(parsedReportItem)
            return mealOfferIdentifier;
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
            case ParseSchedule.PRICE_GROUP_STUDENT: foundPrice = FoodTL1Parser.findFirstPriceValueForFields(parsedReportItem, [FoodTL1Parser.FIELD_PRICE_STUDENT_OSNABRUECK, FoodTL1Parser.FIELD_PRICE_STUDENT_HANNOVER]); break;
            case ParseSchedule.PRICE_GROUP_EMPLOYEE: foundPrice = FoodTL1Parser.findFirstPriceValueForFields(parsedReportItem, [FoodTL1Parser.FIELD_PRICE_EMPLOYEE_OSNABRUECK, FoodTL1Parser.FIELD_PRICE_EMPLOYEE_HANNOVER]); break;
            case ParseSchedule.PRICE_GROUP_GUEST: foundPrice = FoodTL1Parser.findFirstPriceValueForFields(parsedReportItem, [FoodTL1Parser.FIELD_PRICE_GUEST_OSNABRUECK, FoodTL1Parser.FIELD_PRICE_GUEST_HANNOVER]); break;
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

    /**
     * WARNING ! These are not the markings for an meal_offer ! These are only markings in general.
     * @alternative getMealOfferMarkingLabelsFromParsedItem to get the markings for a meal
     * @param parsedReportItem
     */
    static getGenerelMarkingsFromRawMealOffer(rawMealOffer){
        let parsedReportItem = FoodTL1Parser.getParsedReportItemFromRawMealOffer(rawMealOffer);
        let markingLabelString = parsedReportItem[FoodTL1Parser.DEFAULT_MARKING_LABELS_FIELD];
        //  e. G. "ZSNUMMERN": "2, 9, a, c, j, m, 40, 0",

        let markingNamesString = parsedReportItem[FoodTL1Parser.DEFAULT_MARKING_NAMES_FIELD];
        // e. G. "ZSNAMEN": "mit Konservierungsstoff, mit Süßungsmitteln, Glutenhaltiges Getreide (a), Hühnerei (c), Senf (j), Sesam (m), Geflügel, zusatzstoff- und allergenfrei",

        // The idea is, each number corresponds in position with each list, so we split
        let markingLabelSplits = markingLabelString.split(",");
        let markingNamesSplits = markingNamesString.split(",");

        let markings = [];
        if(markingLabelSplits.length===markingNamesSplits.length){
            //we should now have to lists where each correspond to the other
            for(let i=0; i<markingLabelSplits.length; i++){
                let label = markingLabelSplits[i];
                label = label.trim();

                let name = markingNamesSplits[i];//Glutenhaltiges Getreide (a)
                name = name.split("(")[0];// "Glutenhaltiges Getreide "
                name = name.trim();

                if(!!name && !!label){
                    markings.push({
                        label: label,
                        external_identifier: label,
                    })
                }
            }
        }

        return markings;
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
