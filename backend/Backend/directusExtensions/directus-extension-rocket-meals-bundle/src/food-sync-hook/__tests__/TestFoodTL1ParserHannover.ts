// small jest test
import { describe, it, expect } from '@jest/globals';
import {FoodTL1Parser} from "../FoodTL1Parser";
import {FoodTL1Parser_GetRawReportInterface} from "../FoodTL1Parser_GetRawReportInterface";
import {FoodTL1Parser_RawReportTestReaderHannover} from "../FoodTL1Parser_RawReportTestReaderHannover";
import {FoodoffersTypeForParser} from "../FoodParserInterface";

describe("FoodTL1ParserHannover Test", () => {
    let testFileGetter: FoodTL1Parser_GetRawReportInterface = new FoodTL1Parser_RawReportTestReaderHannover();
    let foodParser: FoodTL1Parser = new FoodTL1Parser(testFileGetter);

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

    it("Have no critical duplicates", async () => {
        await foodParser.createNeededData();

        let foodoffersTypeForParserList = await foodParser.getFoodoffersForParser();
        let uniqueOffers: {[key: string]: any} = {};
        let uncheckedDuplicateOffers: {[key: string]: FoodoffersTypeForParser[]} = {};
        if(!!foodoffersTypeForParserList){
            for(let foodofferTypeForParser of foodoffersTypeForParserList){
                let isoDateStringOfMealOffer = foodofferTypeForParser.basicFoodofferData.date;
                let food_id = foodofferTypeForParser.food_id
                let canteenLabel = foodofferTypeForParser.canteen_external_identifier
                let compositeKey = isoDateStringOfMealOffer + "_" + food_id + "_" + canteenLabel;
                if(uniqueOffers[compositeKey] === undefined) {
                    uniqueOffers[compositeKey] = foodofferTypeForParser;
                } else {
                    let uniqueOffer = uniqueOffers[compositeKey];
                    let duplicateList = uncheckedDuplicateOffers[compositeKey] || [uniqueOffer];
                    duplicateList.push(foodofferTypeForParser);
                    uncheckedDuplicateOffers[compositeKey] = duplicateList;
                }
            }
        }


        let criticalDuplicates: {[key: string]: FoodoffersTypeForParser[]} = {};

        // print duplicates amount and keys
        let uncheckedDuplicateKeys = Object.keys(uncheckedDuplicateOffers);
        //console.log("duplicateKeys.length: ", uncheckedDuplicateKeys.length);
        for(let key of uncheckedDuplicateKeys){
            const listOfDuplicatesForThisKey = uncheckedDuplicateOffers[key];

            if(!!listOfDuplicatesForThisKey){
                // Check for Niedersachsenmenü duplicates - These are okay, since they currently have the same name until 30.06.2024
                if(listOfDuplicatesForThisKey.length===2){
                    let firstDuplicate = listOfDuplicatesForThisKey[0];
                    let secondDuplicate = listOfDuplicatesForThisKey[1];
                    let name1 = firstDuplicate?.basicFoodofferData.alias;
                    let name2 = secondDuplicate?.basicFoodofferData.alias;
                    const allowedPrefix = "Niedersachsenmenü: ";
                    // if exactly one of the names has the prefix, then it is not a critical duplicate
                    if(!name1){
                        continue
                    }
                    if(!name2){
                        continue
                    }
                    if(name1.startsWith(allowedPrefix) !== name2.startsWith(allowedPrefix)){
                        continue;
                    }
                }

                // check for canteen Zentralproduktion duplicates - These are okay, since Zentralproduktion is a special canteen which will not be in the production system
                if(listOfDuplicatesForThisKey.length===2){
                    let firstDuplicate = listOfDuplicatesForThisKey[0];
                    let secondDuplicate = listOfDuplicatesForThisKey[1];
                    let canteen1 = firstDuplicate?.canteen_external_identifier
                    let canteen2 = secondDuplicate?.canteen_external_identifier
                    if(canteen1 === "Zentralproduktion" && canteen2 === "Zentralproduktion"){
                        continue;
                    }
                }


                criticalDuplicates[key] = listOfDuplicatesForThisKey;
            }
        }

        // print critical duplicates
        let criticalDuplicateKeys = Object.keys(criticalDuplicates);
        if(criticalDuplicateKeys.length > 0){
            console.log("criticalDuplicateKeys.length: ", criticalDuplicateKeys.length);
            for(let key of criticalDuplicateKeys){
                console.log("key: ", key);
                let listOfDuplicatesForThisKey = criticalDuplicates[key];
                if(!!listOfDuplicatesForThisKey){
                    for(let duplicate of listOfDuplicatesForThisKey){
                        let name = duplicate.basicFoodofferData.alias
                        console.log("-- name: ", name);
                    }
                }
            }
        }
        expect(criticalDuplicateKeys.length).toBe(0);

    });
});