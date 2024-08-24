import axios from "axios";
import {FoodTL1Parser} from "./FoodTL1Parser"
import {
    CanteensTypeForParser,
    FoodoffersTypeForParser, FoodofferTypeWithBasicData,
    FoodParserInterface,
    FoodsInformationTypeForParser
} from "./FoodParserInterface";
import {MarkingParserInterface, MarkingsTypeForParser} from "./MarkingParserInterface";
import {TranslationHelper} from "../helpers/TranslationHelper";

const DEFAULT_AMOUNT_OF_DAYS_TO_PULL = 8;

type SWOSY_MARKINGS_TYPE = {
    classification: string,
    description	: string,
    descriptionEnglish: string,
    id: string,
    label: string,
}

type SWOSY_MEALS_TYPE = {
    id: string;
    name: string;
    nameEng: string;
    kcal: number;
    carbohydratesInGrams: number;
    proteinInGrams: number;
    fatInGrams: number;
    saturatedFatInGrams: number;
    sugarInGrams: number;
    fiberInGrams: number;
    saltInGrams: number;
    rating_amount: number | null;
    rating_average: number | null;
    text1: string;
    text1Eng: string;
    text2: string;
    text2Eng: string;
    text3: string;
    text3Eng: string;
    text4: string;
    text4Eng: string;
    text5: string;
    text5Eng: string;
    text6: string;
    text6Eng: string;
    updatedAt: string;
};

type SWOSY_CANTEENS_TYPE = {
    id: number;
    name: string;
    cashregisterids: string;
    trafficMaxCalculated: number;
    trafficMaxManual: number;
    trafficColors: string | null;
    trafficPrecision: number | null;
    popularTimeMinuteInterval: number | null;
    opening_time_monday: string;
    closing_time_monday: string;
    opening_time_tuesday: string;
    closing_time_tuesday: string;
    opening_time_wednesday: string;
    closing_time_wednesday: string;
    opening_time_thursday: string;
    closing_time_thursday: string;
    opening_time_friday: string;
    closing_time_friday: string;
    opening_time_saturday: string | null;
    closing_time_saturday: string | null;
    opening_time_sunday: string | null;
    closing_time_sunday: string | null;
    createdAt: string;
    updatedAt: string;
    BuildingId: number;
}

type SWOSY_MEALOFFERS_TYPE = {
    priceStudent: number;
    priceEmployee: number;
    priceGuest: number;
    displayName: string;
    displayNameEng: string;
    totalMarkings: string;
    leftFoodAmount: number | null;
    toGo: boolean;
    toStay: boolean;
    niedersachsenMenu: boolean;
    date: string;
    createdAt: string;
    updatedAt: string;
    MealId: string;
    CanteenId: number;
};



export class SWOSY_API_Parser implements FoodParserInterface, MarkingParserInterface {

    private amountOfDaysToPull: number
    private foods: {[key: string]: SWOSY_MEALS_TYPE} = {};
    private canteens: {[key: string]: SWOSY_CANTEENS_TYPE} = {};
    private api_url = "";

    constructor(api_url: string, amountOfDaysToPull=DEFAULT_AMOUNT_OF_DAYS_TO_PULL) {
        this.foods = {};
        this.canteens = {};
        this.api_url = api_url;
        this.amountOfDaysToPull = amountOfDaysToPull;
    }

    async createNeededData(){
        this.foods = {};
        this.canteens = {};
        this.foods = await this.downloadDictFoodIdToFood();
        this.canteens = await this.downloadCanteensDictIdToCanteen();
    }

    static getImageRemoteUrlForMealId(api_url: string, meal_id: string){
        // high = 2048x2048
        // medium = 1024x1024
        // low = 512x512

        return api_url + "/meals/" + meal_id + "/photos?resTag=high&webp=false"; // download already cropped image with high resolution
    }

    async getMarkingsJSONList(): Promise<MarkingsTypeForParser[]> {
        let download = await axios.get(this.api_url+"/markings");
        let remoteItems: SWOSY_MARKINGS_TYPE[] = download.data;
        let itemJSONList: MarkingsTypeForParser[] = [];
        for(let remoteItem of remoteItems){
            itemJSONList.push({
                alias: remoteItem.label,
                external_identifier: remoteItem.label,
                translations: {
                    [TranslationHelper.LANGUAGE_CODE_DE]: {"name": remoteItem.description}
                }
            })
        }
        return itemJSONList;
    }

    async getCanteensList(): Promise<CanteensTypeForParser[]> {
        let canteens = this.canteens;
        let canteenIds = Object.keys(canteens);
        let itemJSONList: CanteensTypeForParser[] = [];
        for(let canteenId of canteenIds){
            let canteen = canteens[canteenId];
            const canteenName = canteen?.name;
            if(!!canteenName){
                itemJSONList.push({
                    alias: canteenName,
                    external_identifier: canteenName
                })
            }
        }
        return itemJSONList;
    }

    async getFoodsListForParser(): Promise<FoodsInformationTypeForParser[]> {
        let foods = this.foods;
        let foodIds = Object.keys(foods);
        let result: FoodsInformationTypeForParser[] = [];
        for(let foodId of foodIds){
            let food = foods[foodId];
            const food_id = food?.id;
            const food_name = food?.name;
            if(!!food_id && !!food_name && !!food){
                result.push({
                    basicFoodData: {
                        id: food_id,
                        alias: food?.name,
                        ...this.getMealNutritionsFromFood(food),
                        rating_amount_legacy: food?.rating_amount,
                        rating_average_legacy: food?.rating_average,
                    },
                    translations: {
                        [TranslationHelper.LANGUAGE_CODE_DE]: {"name": food?.name},
                        [TranslationHelper.LANGUAGE_CODE_EN]: {"name": food?.nameEng}
                    },
                    marking_external_identifiers: this.getMarkingExternalIdentifierListForFoodJSON(food)
                })
            }
        }
        return result;
    }

    private getMarkingExternalIdentifierListForFoodJSON(food: SWOSY_MEALS_TYPE){
        let name = "";
        name += food?.text1;
        name += food?.text2;
        name += food?.text3;
        name += food?.text4;
        name += food?.text5;
        name += food?.text6;

        let markingsDict = FoodTL1Parser.getMarkingLabelsDictFromFoodName(name)
        return Object.keys(markingsDict)
    }

    private parseFloatWithOneDecimal(str: string | number | undefined | any): number | null {
        if(!str){
            return null;
        }
        let num = parseFloat(str);
        if (isNaN(num)) {
            return NaN; // or some other value to indicate the parse failed
        }
        return Math.round(num * 10) / 10;
    }

    private getMealNutritionsFromFood(food: SWOSY_MEALS_TYPE){
        //
            let fiber_g = this.parseFloatWithOneDecimal(food?.["fiberInGrams"]);
            if(!fiber_g){
                fiber_g = null;
            }

            let protein_g = this.parseFloatWithOneDecimal(food?.["proteinInGrams"]);
            if(!protein_g){
                protein_g = null;
            }

            return {
                calories_kcal: this.parseFloatWithOneDecimal(food?.["kcal"]),
                fat_g: this.parseFloatWithOneDecimal(food?.["fatInGrams"]),
                saturated_fat_g: this.parseFloatWithOneDecimal?.(food["saturatedFatInGrams"]),
                carbohydrate_g: this.parseFloatWithOneDecimal?.(food["carbohydratesInGrams"]),
                sugar_g: this.parseFloatWithOneDecimal?.(food["sugarInGrams"]),
                fiber_g: fiber_g,
                protein_g: protein_g,
                sodium_g: this.parseFloatWithOneDecimal?.(food["saltInGrams"]),
            };
    }

    getDatesOfAmountNextDaysIncludingToday(amount: number){
        let dates = [];
        let tempDate = new Date();
        tempDate.setMilliseconds(0);
        tempDate.setSeconds(0);
        tempDate.setMinutes(0);
        tempDate.setHours(12);

        for(let i=0; i<amount; i++){
            dates.push(new Date(tempDate.toISOString())); //copy date into list
            tempDate.setDate(tempDate.getDate()+1);
        }
        return dates;
    }

    async getFoodoffersForParser(): Promise<FoodoffersTypeForParser[]> {
        let foodOffers: FoodoffersTypeForParser[] = [];
        let canteens = this.canteens;
        let canteenIds = Object.keys(canteens);

        let dates = this.getDatesOfAmountNextDaysIncludingToday(this.amountOfDaysToPull);

        for(let canteenId of canteenIds){
            let offers = await this.getRawMealOffersJSONListForCanteenIdAndDates(canteenId, dates);
            foodOffers = foodOffers.concat(offers);
        }
        return foodOffers;
    }

    getCanteenExternalIdentifierFromRawMealOffer(rawMealOffer:  SWOSY_MEALOFFERS_TYPE){
        let canteenId = rawMealOffer["CanteenId"];
        let canteen = this.canteens[canteenId];
        return canteen?.name;
    }

    getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer: SWOSY_MEALOFFERS_TYPE){
        let totalMarkings = rawMealOffer["totalMarkings"];
        let splits = totalMarkings.split(",");
        let markingLabels = [];
        for(let split of splits){
            markingLabels.push(split.trim());
        }
        return markingLabels;
    }

    /**
     *
     */

    async getRawMealOffersJSONListForCanteenIdAndDates(canteenId: string, dates: Date[]): Promise<FoodoffersTypeForParser[]> {
        let mealOffers: FoodoffersTypeForParser[] = [];
        for(let date of dates){
            let offers = await this.getRawMealOffersJSONListForCanteenId(canteenId, date);
            mealOffers = mealOffers.concat(offers);
        }
        return mealOffers;
    }

    async getRawMealOffersJSONListForCanteenId(canteenId: string, date: Date): Promise<FoodoffersTypeForParser[]> {
        date = new Date(date);
        let day = this.padToTwoDigits(date.getDate());
        let month = this.padToTwoDigits(date.getMonth()+1);
        let year = date.getFullYear();
        let download = await axios.get(this.api_url+"/canteens/"+canteenId+"/days/"+day+"-"+month+"-"+year+"/meals");
        let downloadedData: SWOSY_MEALOFFERS_TYPE[] = download.data;
        let foodoffersForParser: FoodoffersTypeForParser[] = [];
        for(let swosyMealOffer of downloadedData){
            swosyMealOffer.date = date.toISOString();
            const canteen_external_identifier = this.getCanteenExternalIdentifierFromRawMealOffer(swosyMealOffer);

            if(!!canteen_external_identifier){
                const basicFoodofferData: FoodofferTypeWithBasicData = {
                    price_student: swosyMealOffer.priceStudent,
                    price_employee: swosyMealOffer.priceEmployee,
                    price_guest: swosyMealOffer.priceGuest,
                }

                foodoffersForParser.push({
                    food_id: swosyMealOffer.MealId,
                    date: {
                        year: year,
                        month: parseInt(month),
                        day: parseInt(day)
                    },
                    basicFoodofferData: basicFoodofferData,
                    canteen_external_identifier: canteen_external_identifier,
                    marking_external_identifiers: this.getMarkingsExternalIdentifiersFromRawMealOffer(swosyMealOffer),
                })
            }
        }
        return foodoffersForParser;
    }

    padToTwoDigits(number: number){
        let t = ""+number;
        return t.padStart(2, "0");
    }

    async downloadDictFoodIdToFood(){
        let download = await axios.get(this.api_url+"/meals");
        let remoteItems = download.data;
        let dict: {[key: string]: SWOSY_MEALS_TYPE} = {};
        for(let remoteItem of remoteItems){
            if(!!remoteItem && !!remoteItem.id){
                dict[remoteItem.id] = remoteItem
            }
        }
        return dict;
    }

    async downloadCanteensDictIdToCanteen(){
        let download = await axios.get(this.api_url+"/canteens");
        let remoteItems = download.data;
        let dict: {[key: string]: SWOSY_CANTEENS_TYPE} = {};
        for(let remoteItem of remoteItems){
            dict[remoteItem.id] = remoteItem
        }
        return dict;
    }

}
