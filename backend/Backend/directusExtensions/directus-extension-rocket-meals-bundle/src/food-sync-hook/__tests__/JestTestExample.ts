// small jest test
import { describe, it, expect } from '@jest/globals';
import {FoodTL1Parser} from "../FoodTL1Parser";
import {FoodTL1Parser_GetRawReportInterface} from "../FoodTL1Parser_GetRawReportInterface";
import {FoodTL1Parser_RawReportTestReaderHannover} from "../FoodTL1Parser_RawReportTestReaderHannover";

describe("FoodTL1Parser Test", () => {
    let testFileGetter: FoodTL1Parser_GetRawReportInterface = new FoodTL1Parser_RawReportTestReaderHannover();
    let foodParser: FoodTL1Parser = new FoodTL1Parser(testFileGetter);

    it("should return true", async () => {
        await foodParser.createNeededData();
        let foodsJson = await foodParser.getMealsJSONList();
        //     [
        //       {
        //         id: '800154',
        //         alias: 'Kräuterdip 3,6Kg',
        //         category: 'VEGGIE & VEGAN',
        //         translations: { 'de-DE': [Object], 'en-US': [Object] }
        //       },
        //       {
        //         id: '800269',
        //         alias: 'Marinierte Tofuwürfel ca 3,6Kg',
        //         category: 'VEGGIE & VEGAN',
        //         translations: { 'de-DE': [Object], 'en-US': [Object] }
        //       },
        //       {

        const dublicate_food_ID: string = "800562-801454-802193-802564";

        let rawMealOffersJSONList = await foodParser.getRawMealOffersJSONList();
        for(let rawFoodOffer of rawMealOffersJSONList){
            let isoDateStringOfMealOffer = await foodParser.getISODateStringOfMealOffer(rawFoodOffer)
            let food_id = await foodParser.getMealIdFromRawMealOffer(rawFoodOffer);
            if(dublicate_food_ID === food_id){
                let canteenLabel = await foodParser.getCanteenLabelFromRawMealOffer(rawFoodOffer);
                let alias = await foodParser.getAliasForMealOfferFromRawMealOffer(rawFoodOffer);
                if(canteenLabel==="Hauptmensa"){
                    console.log("canteenLabel: " + canteenLabel+ " food_id: " + food_id + " isoDateStringOfMealOffer: " + isoDateStringOfMealOffer + " alias: " + alias);
                }
            }
        }

        expect(true).toBe(true);
    });
});