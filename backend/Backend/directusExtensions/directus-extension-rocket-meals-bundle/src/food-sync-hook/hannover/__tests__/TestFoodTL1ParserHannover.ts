// small jest test
import { describe, it, expect } from '@jest/globals';
import {FoodTL1ParserHannover} from "../FoodTL1ParserHannover";
import {FoodTL1Parser_GetRawReportInterface} from "../../FoodTL1Parser_GetRawReportInterface";
import {FoodTL1Parser_RawReportTestReaderHannover} from "../FoodTL1Parser_RawReportTestReaderHannover";
import {FoodoffersTypeForParser, FoodsInformationTypeForParser} from "../../FoodParserInterface";
import {FoodTL1Parser} from "../../FoodTL1Parser";

function generateFoodId(foodIds: number[], markingExternalIdentifiers: string[]): string | null {
    return FoodTL1ParserHannover.getHannoverFoodId(foodIds, markingExternalIdentifiers);
}

async function getFoodoffersJson(reportToReturn?: string | undefined){
    let testFileGetter: FoodTL1Parser_GetRawReportInterface = new FoodTL1Parser_RawReportTestReaderHannover(reportToReturn);
    let foodParser: FoodTL1Parser = new FoodTL1ParserHannover(testFileGetter);
    await foodParser.createNeededData();
    return await foodParser.getFoodoffersForParser();
}

async function getFoodsJson(reportToReturn?: string | undefined){
    let testFileGetter: FoodTL1Parser_GetRawReportInterface = new FoodTL1Parser_RawReportTestReaderHannover(reportToReturn);
    let foodParser: FoodTL1Parser = new FoodTL1ParserHannover(testFileGetter);
    await foodParser.createNeededData();
    return await foodParser.getFoodsListForParser();
}

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

    function checkIfFoodHasMarking(foodId: string | null, expectedMarkingExternalIdentifiersToBeIncluded: string[], foodOffersJson: FoodoffersTypeForParser[]){
        let foodOffersWithSpecialMarking = foodOffersJson.filter((foodOffer) => {
            return foodOffer.food_id === foodId;
        });

        expect(foodOffersWithSpecialMarking.length).toBeGreaterThan(0);
        for(let foodOffer of foodOffersWithSpecialMarking){
            // check if foodOffer.marking_external_identifiers contains 'v'
            expect(foodOffer.marking_external_identifiers).toEqual(expect.arrayContaining(expectedMarkingExternalIdentifiersToBeIncluded));
        }
    }

    it("Markings use correctly addition field for vegetarian (v)", async () => {
        const marking_external_identifiers = ["26", "99", "v"];
        let findFoodId = generateFoodId([801346, 802285], marking_external_identifiers)
        const expectedMarkingExternalIdentifiersToBeIncluded = [ 'v' ];
        let foodOfferJson = await getFoodoffersJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithVegatarian());
        checkIfFoodHasMarking(findFoodId, expectedMarkingExternalIdentifiersToBeIncluded, foodOfferJson);
    })

    it("Markings use correctly additional field for vegan (x)", async () => {
        const marking_external_identifiers = ['4',   '20', '20A', '20C', '25',  '99', 'x'];
        let findFoodId = generateFoodId([800562,802726,801834, 801454], marking_external_identifiers)
        let foodOfferJson = await getFoodoffersJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithVegan());

        const expectedMarkingExternalIdentifiersToBeIncluded = [ 'x' ];
        checkIfFoodHasMarking(findFoodId, expectedMarkingExternalIdentifiersToBeIncluded, foodOfferJson);
    });


    it("Markings correctly used the ZS_NUMMERN Field", async () => {
        await foodParser.createNeededData();
        let foodsJson = await foodParser.getFoodsListForParser();
        // search for "Veganes Schnitzel" in the foodoffers
        let foundVeganesSchnitzel = false;
        // 3, 15, 20, 20A, 20D, 99
        const expectedMarkingExternalIdentifiers = [ '3', '15', '20', '20A', '20D', '99', "x" ];
        const findFoodId = generateFoodId([802336, 802338, 802777], expectedMarkingExternalIdentifiers);
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

    it("Foodoffers all have category", async () => {
        await foodParser.createNeededData();
        let foodOffersJson = await foodParser.getFoodoffersForParser();
        let everyFoodofferHasCategory = true;
        for (let foodOffer of foodOffersJson) {
            if (!foodOffer.category_external_identifier) {
                everyFoodofferHasCategory = false;
                break;
            }
        }
        expect(everyFoodofferHasCategory).toBe(true);
    });

    it("Foodoffer has correct category", async () => {
        let foodOffersJson = await getFoodoffersJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithFoodofferCategoryMeat());
        let firstFoodOffer = foodOffersJson[0];
        expect(!!firstFoodOffer).toBe(true);
        if(firstFoodOffer){
            expect(firstFoodOffer.category_external_identifier).toBe("FLEISCH & MEER");
        }
    });

    it("Food all have category", async () => {
        await foodParser.createNeededData();
        let foodsJson = await foodParser.getFoodsListForParser();
        let everyFoodHasCategory = true;
        for(let food of foodsJson){
            if(!food.category_external_identifier){
                everyFoodHasCategory = false;
                break;
            }
        }
        expect(everyFoodHasCategory).toBe(true);
    })

    it("Food has correct category", async () => {
        let foodsJson = await getFoodsJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithFoodofferCategoryMeat());
        let foodJson = foodsJson[0];
        expect(!!foodJson).toBe(true);
        if(foodJson){
            expect(foodJson.category_external_identifier).toBe("FLEISCH & MEER");
        }
    })

    it("Food offers with same recipe ids and same markings shall have same food ids", async () => {
        let foodOfferJson = await getFoodoffersJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithMultipleFoodoofersSameMarkings());
        let foodsJson = await getFoodsJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithMultipleFoodoofersSameMarkings());
        // we should have more than one foodoffer
        expect(foodOfferJson.length).toBeGreaterThan(1);
        // we should have only one food
        let dictFoodIds: {[key: string]: any} = {};
        for(let foodOffer of foodOfferJson){
            if(!!dictFoodIds[foodOffer.food_id]){
                dictFoodIds[foodOffer.food_id].push(foodOffer);
            } else {
                dictFoodIds[foodOffer.food_id] = [foodOffer];
            }
        }
        // we should have only one food
        expect(Object.keys(dictFoodIds).length).toBe(1);
        expect(foodsJson.length).toBe(1);
    });

    it("Food offers with same recipe ids and differnet markings shall have different food ids", async () => {
        let foodOfferJson = await getFoodoffersJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithMultipleFoodoofersDifferentMarkings());
        let foodsJson = await getFoodsJson(FoodTL1Parser_RawReportTestReaderHannover.getSavedRawReportWithMultipleFoodoofersDifferentMarkings());
        // we should have more than one foodoffer
        expect(foodOfferJson.length).toBeGreaterThan(1);
        // we should have more than one food
        let dictFoodIds: {[key: string]: any} = {};
        for(let foodOffer of foodOfferJson){
            if(!!dictFoodIds[foodOffer.food_id]){
                dictFoodIds[foodOffer.food_id].push(foodOffer);
            } else {
                dictFoodIds[foodOffer.food_id] = [foodOffer];
            }
        }
        // we should have more than one food
        expect(Object.keys(dictFoodIds).length).toBeGreaterThan(1);
        expect(foodsJson.length).toBeGreaterThan(1);
    });

});