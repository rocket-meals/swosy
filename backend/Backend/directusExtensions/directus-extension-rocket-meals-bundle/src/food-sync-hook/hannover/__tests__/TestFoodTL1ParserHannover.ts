// small jest test
import { describe, it, expect } from '@jest/globals';
import {FoodTL1ParserHannover} from "../FoodTL1ParserHannover";
import {FoodTL1Parser_GetRawReportInterface} from "../../FoodTL1Parser_GetRawReportInterface";
import {FoodTL1Parser_RawReportTestReaderHannover} from "../FoodTL1Parser_RawReportTestReaderHannover";
import {FoodoffersTypeForParser, FoodsInformationTypeForParser} from "../../FoodParserInterface";
import {FoodTL1Parser} from "../../FoodTL1Parser";

describe("FoodTL1ParserHannover Test", () => {

    let testFileGetter: FoodTL1Parser_GetRawReportInterface = new FoodTL1Parser_RawReportTestReaderHannover();
    let foodParser: FoodTL1Parser = new FoodTL1ParserHannover(testFileGetter);

    // should find atleast one food
    it("Find more than one food", async () => {
        await foodParser.createNeededData();
        let foodsJson = await foodParser.getFoodsListForParser();
        expect(foodsJson.length).toBeGreaterThan(0);
    });

    // should find atleast one canteen
    it("Find more than one canteen", async () => {
        await foodParser.createNeededData();
        let canteensJson = await foodParser.getCanteensList();
        expect(canteensJson.length).toBeGreaterThan(0);
    });

    // should find atleast one meal offer
    it("Find more than one meal offer", async () => {
        await foodParser.createNeededData();
        let mealOffersJson = await foodParser.getFoodoffersForParser();
        if(!!mealOffersJson){
            expect(mealOffersJson.length).toBeGreaterThan(0);
        } else {
            expect(false).toBe(true);
        }
    });

    it("Foods shall have not fiber_g", async () => {
        await foodParser.createNeededData();
        let foodsJson = await foodParser.getFoodsListForParser();
        let foundFiber = false;
        for(let food of foodsJson){
            if(!!food.basicFoodData.fiber_g){
                foundFiber = true;
                break;
            }
        }
        expect(foundFiber).toBe(false);
    });

    it("Foodoffers shall have not fiber_g", async () => {
        await foodParser.createNeededData();
        let foodOffersJson = await foodParser.getFoodoffersForParser();
        let foundFiber = false;
        for(let foodOffer of foodOffersJson){
            if(!!foodOffer.basicFoodofferData.fiber_g){
                foundFiber = true;
                break;
            }
        }
        expect(foundFiber).toBe(false);
    });


    it("Markings correctly used the ZS_NUMMERN Field", async () => {
        await foodParser.createNeededData();
        let foodsJson = await foodParser.getFoodsListForParser();
        // search for "Veganes Schnitzel" in the foodoffers
        let foundVeganesSchnitzel = false;
        const findFoodId = "802336-802338-802777"
        const expectedMarkingExternalIdentifiers = [ '3', '15', '20', '20A', '20D', '99' ];
        let foodWithSpecialMarking: FoodsInformationTypeForParser | null = null;

        for(let food of foodsJson){
            //console.log(food.basicFoodData.alias)
            if(food.basicFoodData.id === findFoodId){
                foundVeganesSchnitzel = true;
                foodWithSpecialMarking = food;
                break;
            }
        }

        expect(foundVeganesSchnitzel).toBe(true);

        if(foodWithSpecialMarking){
            //console.log("Check if food has the correct markings");
            expect(foodWithSpecialMarking.marking_external_identifiers).toEqual(expect.arrayContaining(expectedMarkingExternalIdentifiers));

            //console.log("Check if foodoffers have the correct markings");
            let foodOffersJson = await foodParser.getFoodoffersForParser();
            let foodOffersWithSpecialMarking = foodOffersJson.filter((foodOffer) => {
                return foodOffer.food_id === findFoodId;
            });
            //console.log("found foodoffers")
            //console.log(foodOffersWithSpecialMarking)

            //console.log("Expect foodoffers to be found")
            expect(foodOffersWithSpecialMarking.length).toBeGreaterThan(0);

            for(let foodOffer of foodOffersWithSpecialMarking){
                //console.log("Check foodoffer: "+ foodOffer.basicFoodofferData.alias + " " + JSON.stringify(foodOffer.date) + " " + foodOffer.canteen_external_identifier);
                //console.log("Foodoffer markings: ", foodOffer.marking_external_identifiers);
                expect(foodOffer.marking_external_identifiers).toEqual(expect.arrayContaining(expectedMarkingExternalIdentifiers));
            }

        }
    })
});