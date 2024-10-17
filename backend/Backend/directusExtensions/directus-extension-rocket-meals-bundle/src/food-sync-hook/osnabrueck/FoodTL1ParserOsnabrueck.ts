import {FoodTL1Parser} from "../FoodTL1Parser";
import {FoodTL1Parser_GetRawReportInterface} from "../FoodTL1Parser_GetRawReportInterface";
import {FoodoffersTypeForParser, FoodsInformationTypeForParser} from "../FoodParserInterface";
import {FoodTL1ParserHelper} from "../FoodTL1ParserHelper";

export class FoodTL1ParserOsnabrueck extends FoodTL1Parser {

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

}
