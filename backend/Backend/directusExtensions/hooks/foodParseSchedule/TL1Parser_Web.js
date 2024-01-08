import moment from "moment";
import {CSVExportParser} from "./CSVExportParser.js"

import axios from "axios"
import fs from "fs";
import path from "path"

export class TL1Parser_Web {

    static DEFAULT_CANTEEN_FIELD = "MENSA";
    static DEFAULT_DATE_FIELD = "DATUM";
    static DEFAULT_TEXT_FIELD = "TEXT";
    static DEFAULT_RECIPE_ID_FIELD = "REZEPTUR_ID";
    static DEFAULT_NUTRITIONS_FIELD = "NAEHRWERTEJEPORT";
    static DEFAULT_PRICE_STUDENT_FIELD = "STD_PREIS";
    static DEFAULT_PRICE_EMPLOYEE_FIELD = "BED_PREIS";
    static DEFAULT_PRICE_GUEST_FIELD = "GÄSTE_PREIS";

    static DEFAULT_MARKING_LABELS_FIELD = "ZSNUMMERN";
    static DEFAULT_MARKING_NAMES_FIELD = "ZSNAMEN";

    rawMealOffers = null;
    foodIdToRawMealOfferDict = null;
    api_url = null;

    constructor(api_url) {
        this.api_url = api_url;
        this.rawMealOffers = null;
        this.foodIdToRawMealOfferDict = null;
    }

    async createNeededData(services, database, logger){
        this.rawMealOffers = await TL1Parser_Web.createRawMealOffers(this.api_url);
        this.foodIdToRawMealOfferDict = TL1Parser_Web.createMealIdToRawMealOfferDict(this.rawMealOffers);
    }

    async getMarkingsJSONList(){
        let rawMealOffers = await this.getRawMealOffersJSONList();
        let markingLabelsDict = {};
        for(let rawMealOffer of rawMealOffers){
            let markingsFromOffer = TL1Parser_Web.getGenerelMarkingsFromRawMealOffer(rawMealOffer);
            for(let marking of markingsFromOffer){
                markingLabelsDict[marking.label] = marking;
            }
        }
        return TL1Parser_Web.getValueListFromDict(markingLabelsDict);
    }

    async getMealsJSONList(){
        let foodIdToRawMealOfferDict = this.foodIdToRawMealOfferDict;
        let foodIds = Object.keys(foodIdToRawMealOfferDict);
        let foodsJSONList = [];
        for(let foodId of foodIds){
            let rawMealOffer = foodIdToRawMealOfferDict[foodId];
            let food = TL1Parser_Web.getMealJSONFromRawMealOffer(rawMealOffer);
            foodsJSONList.push(food);
        }
        return foodsJSONList;
    }

    async getCanteensJSONList(){
        let rawMealOffers = await this.getRawMealOffersJSONList();
        let canteenLabelsDict = {};
        for(let rawMealOffer of rawMealOffers){
            let parsedReportItem = TL1Parser_Web.getParsedReportItemFromRawMealOffer(rawMealOffer);
            let canteenLabel = TL1Parser_Web.getCanteenLabelFunction(parsedReportItem);
            canteenLabelsDict[canteenLabel] = {
                label: canteenLabel,
                external_identifier: canteenLabel,
            };
        }
        return TL1Parser_Web.getValueListFromDict(canteenLabelsDict);
    }

    async getMarkingLabelsForMealJSON(foodJSON){
        let rawMealOffer = this._getRawMealOfferFromMealJSON(foodJSON);
        return TL1Parser_Web.getMealOfferMarkingLabelsFromRawMealOffer(rawMealOffer);
    }

    async getMealNutritionsForMealJSON(foodJSON){
        let rawMealOffer = this._getRawMealOfferFromMealJSON(foodJSON);
        return this.getMealNutritionsForRawMealOffer(rawMealOffer);
    }

    async getMealNutritionsForRawMealOffer(rawMealOffer){
        return TL1Parser_Web.getMealNutritionsFromRawMealOffer(rawMealOffer);
    }

    async getMealOffersISOStringDatesToDelete(rawMealOffersJSONList){
        let datesDict = {};
        for(let rawMealOffer of rawMealOffersJSONList){
            let parsedReportItem = TL1Parser_Web.getParsedReportItemFromRawMealOffer(rawMealOffer);
            let date = TL1Parser_Web.getISODateFunction(parsedReportItem);
            datesDict[date] = date;
        }
        return Object.keys(datesDict);
    }

    async getRawMealOffersJSONList(){
        return this.rawMealOffers;
    }

    async getCanteenLabelFromRawMealOffer(rawMealOffer){
        return rawMealOffer[TL1Parser_Web._MEALOFFERITEM_CANTEEN_LABEL];
    }

    async getMealIdFromRawMealOffer(rawMealOffer){
        return rawMealOffer[TL1Parser_Web._MEALOFFERITEM_MEAL_ID]
    }

    async getISODateStringOfMealOffer(rawMealOffer){
        return rawMealOffer[TL1Parser_Web._MEALOFFERITEM_DATE];
    }

    async getPriceForGroupFromRawMealOffer(group, rawMealOffer){
        let parsedReportItem = TL1Parser_Web.getParsedReportItemFromRawMealOffer(rawMealOffer);
        return TL1Parser_Web.getPriceForGroup(parsedReportItem, group)
    }

    async getMarkingLabelsFromRawMealOffer(rawMealOffer){
        return TL1Parser_Web.getMealOfferMarkingLabelsFromRawMealOffer(rawMealOffer);
    }

    /**
     * Parser for TL1 Reports
     */

    static _MEALOFFERITEM_MEAL_ID = "id";
    static _MEALOFFERITEM_ITEM = "item";
    static _MEALOFFERITEM_DATE = "date";
    static _MEALOFFERITEM_CANTEEN_LABEL = "canteen_label";

    static async createRawMealOffers(api_url){
        let rawReport = await TL1Parser_Web.getRawReport(api_url);
        let parsedReport = CSVExportParser.getListOfLineObjects(rawReport);
        let groupedReportItems = TL1Parser_Web._groupParsedReportItemsToMealOfferListsItems(parsedReport);
        return TL1Parser_Web.createMealOfferJSONFromGroupedList(groupedReportItems);
    }

    static async getRawReport(api_url){
        console.log("TL1Parser_Web: getRawReport");
        console.log("TL1Parser_Web: api_url= "+api_url)
        try{
            const url = "https://share.sw-os.de/swosy";
            const resArBuffer = await axios.request({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
            });
            let response = resArBuffer.data.toString("latin1");
            let text = Buffer.from(response, 'utf-8').toString();
            let content = text;
            console.log("TL1 Report; length= "+content.length);
            return content;
        } catch (err){
            console.log("File not found yet")
            return "";
        }
    }

    static _groupParsedReportItemsToMealOfferListsItems(parsedReport){
        let dictOfItemsForAMealOffer = {};
        for(let item of parsedReport){
            let identifier = TL1Parser_Web.getMealOfferIdentifier(item);
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
            let foodOfferJSON = TL1Parser_Web._createMealOfferFromGroupedItems(listOfItemsForSameMealOffer);
            foodOfferJSONList.push(foodOfferJSON);
        }
        return foodOfferJSONList;
    }

    static _createMealOfferFromGroupedItems(listOfItemsForSameMealOffer){
        let recipe_ids = [];
        let parsedReportItem = listOfItemsForSameMealOffer[0];
        for(let item of listOfItemsForSameMealOffer){
            let item_id = TL1Parser_Web.getRecipeIdFunction(item);
            recipe_ids.push(item_id);
        }
        let food_id = TL1Parser_Web.getSortedMealId(recipe_ids);

        let date = TL1Parser_Web.getISODateFunction(parsedReportItem)
        let canteen_label = TL1Parser_Web.getCanteenLabelFunction(parsedReportItem)

        return {
            [TL1Parser_Web._MEALOFFERITEM_MEAL_ID]: food_id,
            [TL1Parser_Web._MEALOFFERITEM_ITEM]: parsedReportItem,
            [TL1Parser_Web._MEALOFFERITEM_DATE]: date,
            [TL1Parser_Web._MEALOFFERITEM_CANTEEN_LABEL]: canteen_label,
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
            let foodId = TL1Parser_Web.getMealIdFromRawMealOffer(rawMealOffer);
            foodIdsDictToRawMealOffers[foodId] = rawMealOffer;
        }
        return foodIdsDictToRawMealOffers
    }

    _getRawMealOfferFromMealJSON(mealJSON){
        let mealId = mealJSON.id;
        return this.foodIdToRawMealOfferDict[mealId];
    }

    static getMealJSONFromRawMealOffer(rawMealOffer){
        let meal_id = TL1Parser_Web.getMealIdFromRawMealOffer(rawMealOffer);
        let parsedReportItem = rawMealOffer[TL1Parser_Web._MEALOFFERITEM_ITEM];
        return {
            id: meal_id,
//            name: TL1Parser_Web._getMealName(parsedReportItem),
            alias: TL1Parser_Web._getMealName(parsedReportItem),
            translations: {
                "de-DE": {"name": TL1Parser_Web._getMealName(parsedReportItem)},
                "en-US": {"name": TL1Parser_Web._getMealNameEng(parsedReportItem)}
            }
        };
    }

    async getAliasForMealOfferFromRawMealOffer(rawMealOffer){
        //console.log("TL1Parser_Web: getAliasForMealOfferFromRawMealOffer")
        let parsedReportItem = rawMealOffer[TL1Parser_Web._MEALOFFERITEM_ITEM];
        return TL1Parser_Web._getMealName(parsedReportItem);
    }

    static getParsedReportItemFromRawMealOffer(rawMealOffer){
        return rawMealOffer[TL1Parser_Web._MEALOFFERITEM_ITEM];
    }

    static getMealIdFromRawMealOffer(rawMealOffer){
        return rawMealOffer[TL1Parser_Web._MEALOFFERITEM_MEAL_ID];
    }

    static _hasValidName(parsedReportItem){
        let rawNamesList = TL1Parser_Web._getRawNamesList(parsedReportItem);
        if(!!rawNamesList && rawNamesList.length>0){
            let rawName = rawNamesList.join("");
            return rawName.length > 0;
        } else {
            return false;
        }
    }

    static getMealOfferIdentifier(parsedReportItem){
        if(TL1Parser_Web._hasValidName(parsedReportItem)){
            let mealOfferIdentifier = "";
            mealOfferIdentifier += TL1Parser_Web._getCanteenName(parsedReportItem)
            mealOfferIdentifier += TL1Parser_Web._getDatum(parsedReportItem)
            mealOfferIdentifier += TL1Parser_Web._getMealIdentifier(parsedReportItem)
            return mealOfferIdentifier;
        } else {
            return null;
        }
    }

    static getRecipeIdFunction(parsedReportItem) {
        return parsedReportItem[TL1Parser_Web.DEFAULT_RECIPE_ID_FIELD];
    }

    static getISODateFunction(parsedReportItem){
        /**
         *   "DATUM": "25.01.2022",
         */
        let rawDate = TL1Parser_Web._getDatum(parsedReportItem);
        let isoDate = moment(rawDate, "DD-MM-YYYY");
        return isoDate.toISOString();
    }

    static getCanteenLabelFunction(parsedReportItem){
        return parsedReportItem[TL1Parser_Web.DEFAULT_CANTEEN_FIELD];
    }

    static getPriceForGroup(parsedReportItem, groupName){
        let foundPrice = null;
        switch (groupName){
            case "student": foundPrice = parsedReportItem[TL1Parser_Web.DEFAULT_PRICE_STUDENT_FIELD]; break;
            case "employee": foundPrice = parsedReportItem[TL1Parser_Web.DEFAULT_PRICE_EMPLOYEE_FIELD]; break;
            case "guest": foundPrice = parsedReportItem[TL1Parser_Web.DEFAULT_PRICE_GUEST_FIELD]; break;
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
        let parsedReportItem = TL1Parser_Web.getParsedReportItemFromRawMealOffer(rawMealOffer);
        let nutritionValuesJSON = {};
        let nutritionValuesString = parsedReportItem[TL1Parser_Web.DEFAULT_NUTRITIONS_FIELD];
        if(!!nutritionValuesString){
            let kcalEndString = " kcal)";
            let match = nutritionValuesString.match(/\(.* kcal/gm);
            // e. G. (XXXXXXX kcal)
            if(!!match){
                let kcal = match[0].slice(1,kcalEndString.length); //remove starting bracket and kcal)
                nutritionValuesJSON.calories_kcal = parseInt(kcal);
            }

            let fatInGrams = TL1Parser_Web.parseNutritionValue(nutritionValuesString,"Fett");
            nutritionValuesJSON.fat_g = fatInGrams;

            let saturatedFatInGrams = TL1Parser_Web.parseNutritionValue(nutritionValuesString,"Fettsäuren");
            nutritionValuesJSON.saturated_fat_g = saturatedFatInGrams;

            let carbohydratesInGrams = TL1Parser_Web.parseNutritionValue(nutritionValuesString,"Kohlenhydrate");
            nutritionValuesJSON.carbohydrate_g = carbohydratesInGrams;

            let sugarInGrams = TL1Parser_Web.parseNutritionValue(nutritionValuesString,"Zucker");
            nutritionValuesJSON.sugar_g = sugarInGrams;

            let fiberInGrams = TL1Parser_Web.parseNutritionValue(nutritionValuesString,"Ballaststoffe");
            nutritionValuesJSON.fiber_g = fiberInGrams;

            let proteinInGrams = TL1Parser_Web.parseNutritionValue(nutritionValuesString,"Eiweiß");
            nutritionValuesJSON.protein_g = proteinInGrams;

            let saltInGrams = TL1Parser_Web.parseNutritionValue(nutritionValuesString,"Salz");
            nutritionValuesJSON.sodium_g = saltInGrams;
        }
        return nutritionValuesJSON;
    }

    parseFloatWithOneDecimal(str) {
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
                let value = this.parseFloatWithOneDecimal(valueString);
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
        let parsedReportItem = TL1Parser_Web.getParsedReportItemFromRawMealOffer(rawMealOffer);
        let markingsDict = {};
        let rawName = TL1Parser_Web._getRawNamesList(parsedReportItem).join("");
        markingsDict = TL1Parser_Web.getMarkingLabelsDictFromName(rawName);
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
                let listOfPartMarkings = TL1Parser_Web.removeValuesAndWhitespacesAndSeperators(rawMarkingsPart, ["(", ")"], ",");
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
        let parsedReportItem = TL1Parser_Web.getParsedReportItemFromRawMealOffer(rawMealOffer);
        let markingLabelString = parsedReportItem[TL1Parser_Web.DEFAULT_MARKING_LABELS_FIELD];
        //  e. G. "ZSNUMMERN": "2, 9, a, c, j, m, 40, 0",

        let markingNamesString = parsedReportItem[TL1Parser_Web.DEFAULT_MARKING_NAMES_FIELD];
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
        return parsedReportItem[TL1Parser_Web.DEFAULT_CANTEEN_FIELD];
    }

    static _getDatum(parsedReportItem) {
        return parsedReportItem[TL1Parser_Web.DEFAULT_DATE_FIELD];
    }

    static _getMealIdentifier(parsedReportItem) {
        return TL1Parser_Web._getRawNamesList(parsedReportItem).join("");
    }

    static _getRawNamesList(parsedReportItem, postFieldName){
        if(!postFieldName){
            postFieldName = "";
        }
        let meal_partials_names = [];
        for(let i=1; i<= 6; i++){
            let partialName = parsedReportItem[TL1Parser_Web.DEFAULT_TEXT_FIELD+i+postFieldName];
            if(!!partialName && partialName.length>0 && partialName!==" "){
                meal_partials_names.push(partialName);
            }
        }
        return meal_partials_names;
    }



    static _getMealName(parsedReportItem){
        let rawMealName = TL1Parser_Web._getRawNamesList(parsedReportItem, "").join(", ");
        return rawMealName.replace(/ \([^ ]+/gm, ""); //remove all (1,3,) stuff
    }

    static _getMealNameEng(parsedReportItem){
        let rawMealName = TL1Parser_Web._getRawNamesList(parsedReportItem, "_1").join(", ");
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
