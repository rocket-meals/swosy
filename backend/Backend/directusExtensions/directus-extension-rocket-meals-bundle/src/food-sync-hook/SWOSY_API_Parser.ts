import axios from "axios";
import {TL1Parser} from "./TL1Parser"
import {ParserInterface} from "./ParserInterface";

const DEFAULT_AMOUNT_OF_DAYS_TO_PULL = 8;

export class SWOSY_API_Parser implements ParserInterface{

    amountOfDaysToPull: number
    foods = {};
    canteens = {};
    api_url = "";

    constructor(api_url: string, amountOfDaysToPull=DEFAULT_AMOUNT_OF_DAYS_TO_PULL) {
        this.foods = {};
        this.canteens = {};
        this.api_url = api_url;
        this.amountOfDaysToPull = amountOfDaysToPull;
    }

    async createNeededData(){
        this.foods = {};
        this.canteens = {};
        this.foods = await this.downloadMealsDictIdToMeal();
        this.canteens = await this.downloadCanteensDictIdToCanteen();
    }

    private_getImageRemoteUrlForMealId(meal_id: string){
        return this.api_url + "/meals/" + meal_id + "/photos?resTag=low&webp=false";
    }

    async getMarkingsJSONList(){
        let download = await axios.get(this.api_url+"/markings");
        let remoteItems = download.data;
        let itemJSONList = [];
        for(let remoteItem of remoteItems){
            itemJSONList.push({
                alias: remoteItem.label,
                external_identifier: remoteItem.label,
                translations: {
                    "de-DE": {"name": remoteItem.description}
                }
            })
        }
        return itemJSONList;
    }

    async getCanteensJSONList(){
        let canteens = this.canteens;
        let canteenIds = Object.keys(canteens);
        let itemJSONList = [];
        for(let canteenId of canteenIds){
            let canteen = canteens[canteenId];
            itemJSONList.push({
                alias: canteen.name,
                external_identifier: canteen.name
            })
        }
        return itemJSONList;
    }

    async getMealsJSONList(){
        let foods = this.foods;
        let foodIds = Object.keys(foods);
        let itemJSONList = [];
        for(let foodId of foodIds){
            let food = foods[foodId];
            itemJSONList.push({
                id: food.id,
                alias: food?.name,
                image_remote_url: this.private_getImageRemoteUrlForMealId(food.id),
//                name: food.name,
                translations: {
                    "de-DE": {"name": food?.name},
                    "en-US": {"name": food?.nameEng}
                }
            })
        }
        return itemJSONList;
    }

    async getAliasForMealOfferFromRawMealOffer(rawFoodOffer: any){
        let food_id = await this.getMealIdFromRawMealOffer(rawFoodOffer)
        let foods = this.foods;
        let food = foods[food_id];
        return food?.alias;
    }



    async getMarkingLabelsForMealJSON(foodJSON: any){
        let food = await this.getMealFromMealJSON(foodJSON);
        let name = "";
        for(let i=1; i<= 6; i++){
            let textX = food["text"+i];
            name += textX;
        }

        let markingsDict = await TL1Parser.getMarkingLabelsDictFromName(name)
        return Object.keys(markingsDict)
    }

    async getMealNutritionsForMealJSON(foodJSON: any){
        let food = await this.getMealFromMealJSON(foodJSON);
        return await this.getMealNutritionsFromFood(food);
    }

    parseFloatWithOneDecimal(str: string) {
        let num = parseFloat(str);
        if (isNaN(num)) {
            return NaN; // or some other value to indicate the parse failed
        }
        return Math.round(num * 10) / 10;
    }

    async getMealNutritionsFromFood(food: any){
            let fiber_g = this.parseFloatWithOneDecimal(food["fiberInGrams"]);
            if(!fiber_g){
                fiber_g = null;
            }

            let protein_g = this.parseFloatWithOneDecimal(food["proteinInGrams"]);
            if(!protein_g){
                protein_g = null;
            }

            return {
                calories_kcal: this.parseFloatWithOneDecimal(food["kcal"]),
                fat_g: this.parseFloatWithOneDecimal(food["fatInGrams"]),
                saturated_fat_g: this.parseFloatWithOneDecimal(food["saturatedFatInGrams"]),
                carbohydrate_g: this.parseFloatWithOneDecimal(food["carbohydratesInGrams"]),
                sugar_g: this.parseFloatWithOneDecimal(food["sugarInGrams"]),
                fiber_g: fiber_g,
                protein_g: protein_g,
                sodium_g: this.parseFloatWithOneDecimal(food["saltInGrams"]),
            };
    }

    async getMealNutritionsForRawMealOffer(rawMealOffer: any){
        let Meal = rawMealOffer["Meal"] || {};
        return await this.getMealNutritionsFromFood(Meal)
    }

    async getMealOffersISOStringDatesToDelete(rawMealOffersJSONList: any){
        return this.getDatesOfAmountNextDaysIncludingToday(this.amountOfDaysToPull);
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

    async getRawMealOffersJSONList(){
        let foodOffers: any[] = [];
        let canteens = this.canteens;
        let canteenIds = Object.keys(canteens);

        let dates = this.getDatesOfAmountNextDaysIncludingToday(this.amountOfDaysToPull);

        for(let canteenId of canteenIds){
            let offers = await this.getRawMealOffersJSONListForCanteenIdAndDates(canteenId, dates);
            foodOffers = foodOffers.concat(offers);
        }
        return foodOffers;
    }

    async getCanteenLabelFromRawMealOffer(rawMealOffer: any){
        let canteenId = rawMealOffer["CanteenId"];
        let canteen = this.canteens[canteenId];
        return canteen?.name;
    }

    async getMealIdFromRawMealOffer(rawMealOffer: any){
        return rawMealOffer["MealId"];
    }

    async getISODateStringOfMealOffer(rawMealOffer: any){
        return rawMealOffer.date;
    }

    async getPriceForGroupFromRawMealOffer(group: string, rawMealOffer: any){
        let foundPrice = null;
        switch (group){
            case "student": foundPrice = rawMealOffer["priceStudent"]; break;
            case "employee": foundPrice = rawMealOffer["priceEmployee"]; break;
            case "guest": foundPrice = rawMealOffer["priceGuest"]; break;
            default: return null
        }
        return foundPrice;
    }

    async getMarkingsExternalIdentifiersFromRawMealOffer(rawMealOffer: any){
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

    async getRawMealOffersJSONListForCanteenIdAndDates(canteenId: any, dates: Date[]){
        let mealOffers = [];
        for(let date of dates){
            let offers = await this.getRawMealOffersJSONListForCanteenId(canteenId, date);
            mealOffers = mealOffers.concat(offers);
        }
        return mealOffers;
    }

    async getRawMealOffersJSONListForCanteenId(canteenId: any, date: Date){
        date = new Date(date);
        let day = this.padToTwoDigits(date.getDate());
        let month = this.padToTwoDigits(date.getMonth()+1);
        let year = date.getFullYear();
        let download = await axios.get(this.api_url+"/canteens/"+canteenId+"/days/"+day+"-"+month+"-"+year+"/meals");
        let downloadedData = download.data;
        let mealOffers = [];
        for(let mealOffer of downloadedData){
            mealOffer.date = date.toISOString();
            mealOffers.push(mealOffer);
        }
        return mealOffers;
    }

    padToTwoDigits(number: number){
        let t = ""+number;
        return t.padStart(2, "0");
    }

    async downloadMealsDictIdToMeal(){
        let download = await axios.get(this.api_url+"/meals");
        let remoteItems = download.data;
        let dict = {};
        for(let remoteItem of remoteItems){
            dict[remoteItem.id] = remoteItem
        }
        return dict;
    }

    async downloadCanteensDictIdToCanteen(){
        let download = await axios.get(this.api_url+"/canteens");
        let remoteItems = download.data;
        let dict = {};
        for(let remoteItem of remoteItems){
            dict[remoteItem.id] = remoteItem
        }
        return dict;
    }

    getMealFromMealJSON(mealJSON: any){
        console.log(JSON.stringify(mealJSON, null, 2));
        let id = mealJSON.id;
        return this.foods[id];
    }

}
