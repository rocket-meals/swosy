import {FoodTL1Parser, RawFoodofferInformationType, RawTL1FoodofferType, TL1AttributeValueType} from "../FoodTL1Parser";
import {FoodTL1Parser_GetRawReportInterface} from "../FoodTL1Parser_GetRawReportInterface";
import {
    FoodoffersTypeForParser,
    FoodParseFoodAttributesType,
    FoodsInformationTypeForParser
} from "../FoodParserInterface";
import {FoodTL1ParserHelper} from "../FoodTL1ParserHelper";

export class FoodTL1ParserOsnabrueck extends FoodTL1Parser {

    static DEFAULT_CO2_GRAMM_FIELD = "EXTINFO_CO2_WERT";
    static DEFAULT_CO2_SAVING_PERCENTAGE_FIELD = "EXTINFO_CO2_EINSPARUNG";
    static DEFAULT_CO2_RATING_FIELD = "EXTINFO_CO2_BEWERTUNG";

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

    override getFoodCategoryFromRawFoodoffer(rawFoodoffer: RawFoodofferInformationType): string | null {
        let parsedReportItem = FoodTL1Parser.getParsedReportItemFromrawFoodoffer(rawFoodoffer);
        return parsedReportItem?.["SPEISE_BEZEICHNUNG"] || null;
    }

    override getFoodofferCategoryFromRawFoodoffer(rawFoodoffer: RawFoodofferInformationType): string | null {
        let parsedReportItem = FoodTL1Parser.getParsedReportItemFromrawFoodoffer(rawFoodoffer);
        return parsedReportItem?.["SPEISE"] || null;
    }

    override getFoodAttributesFromRawTL1Foodoffer(parsedReportItem: RawTL1FoodofferType): FoodParseFoodAttributesType {
        let foodAttributes = super.getFoodAttributesFromRawTL1Foodoffer(parsedReportItem);

        const csvAttributes = [
            {
                field_name: FoodTL1ParserOsnabrueck.DEFAULT_CO2_GRAMM_FIELD,
                external_identifier: "co2_g",
                value_type: TL1AttributeValueType.NUMBER
            },
            {
                field_name: FoodTL1ParserOsnabrueck.DEFAULT_CO2_SAVING_PERCENTAGE_FIELD,
                external_identifier: "co2_saving_percentage",
                value_type: TL1AttributeValueType.NUMBER
            },
            {
                field_name: FoodTL1ParserOsnabrueck.DEFAULT_CO2_RATING_FIELD,
                external_identifier: "co2_rating",
                value_type: TL1AttributeValueType.STRING
            }
        ]

        let additionalAttributes = FoodTL1Parser.getAdditionalFoodAttributesFromRawTL1Foodoffer(parsedReportItem, csvAttributes);
        foodAttributes = foodAttributes.concat(additionalAttributes);

        return foodAttributes;
    }

}
