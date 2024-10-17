import {FoodTL1Parser, RawFoodofferInformationType} from "../FoodTL1Parser";
import {FoodTL1Parser_GetRawReportInterface} from "../FoodTL1Parser_GetRawReportInterface";
import {FoodoffersTypeForParser, FoodsInformationTypeForParser} from "../FoodParserInterface";
import {FoodTL1ParserHelper} from "../FoodTL1ParserHelper";

export class FoodTL1ParserHannover extends FoodTL1Parser {

    constructor(rawFoodofferReader: FoodTL1Parser_GetRawReportInterface) {
        super(rawFoodofferReader);
    }

    override async getFoodoffersForParser(): Promise<FoodoffersTypeForParser[]> {
        let foodOffers = await super.getFoodoffersForParser();
        foodOffers = FoodTL1ParserHelper.adaptFoodOffersRemoveFiber(foodOffers);
        return foodOffers;
    }

    override async getFoodsListForParser(): Promise<FoodsInformationTypeForParser[]> {
        let foodList = await super.getFoodsListForParser();
        foodList = FoodTL1ParserHelper.adaptFoodsListRemoveFiber(foodList);
        return foodList;
    }

    /**
     * Wait for confirmation in mail if we should user the markings from the ZS_NUMMERN field
     * Hannover Mail: 17.10.2024
     */
    override getMarkingsExternalIdentifiersFromRawFoodoffer(rawFoodoffer: RawFoodofferInformationType){
        //return super.getMarkingsExternalIdentifiersFromRawFoodoffer(rawFoodoffer);

        let tl1_zusatz_nummern_string = rawFoodoffer.raw_tl1_foodoffer_json[FoodTL1Parser.DEFAULT_ZSNUMMERN_FIELD];
        // for example: " 3, 15, 20, 20A, 20D, 99"
        if(!!tl1_zusatz_nummern_string){
            let markings = tl1_zusatz_nummern_string.split(",").map((nummernString) => {
                return nummernString.trim();
            });
            return markings;
        }
        return [];

    }

}
