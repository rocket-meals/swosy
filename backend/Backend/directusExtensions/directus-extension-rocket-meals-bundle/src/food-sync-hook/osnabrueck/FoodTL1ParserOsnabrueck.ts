import {FoodTL1Parser, RawFoodofferInformationType, RawTL1FoodofferType, TL1AttributeValueType} from "../FoodTL1Parser";
import {FoodTL1Parser_GetRawReportInterface} from "../FoodTL1Parser_GetRawReportInterface";
import {
    FoodoffersTypeForParser,
    FoodParseFoodAttributesType,
    FoodsInformationTypeForParser
} from "../FoodParserInterface";
import {FoodTL1ParserHelper} from "../FoodTL1ParserHelper";
import {FoodTL1ParserHannover} from "../hannover/FoodTL1ParserHannover";

export class FoodTL1ParserOsnabrueck extends FoodTL1Parser {

    static DEFAULT_CO2_GRAMM_FIELD = "EXTINFO_CO2_WERT";
    static DEFAULT_CO2_SAVING_PERCENTAGE_FIELD = "EXTINFO_CO2_EINSPARUNG";
    static DEFAULT_CO2_RATING_FIELD = "EXTINFO_CO2_BEWERTUNG";
    static CO2_BEWERTUNG_PREFIX_IDENTIFIER = "CO2_RATING_";

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

    override getMarkingsExternalIdentifiersFromRawFoodoffer(rawFoodoffer: RawFoodofferInformationType){
        let combinedMarkings: string[] = [];
        let defaultMarkings = super.getMarkingsExternalIdentifiersFromRawFoodoffer(rawFoodoffer);
        combinedMarkings = combinedMarkings.concat(defaultMarkings);

        let raw_tl1_foodoffer_json = rawFoodoffer.raw_tl1_foodoffer_json;
        let tl1_co2_bewertung_string = raw_tl1_foodoffer_json[FoodTL1ParserOsnabrueck.DEFAULT_CO2_RATING_FIELD];


        // Philipp Heckmann 19.02.2025 - Spalte „Ext. CO2 Bew.“ erfolgen. Immer wenn in dieser Spalte bei einem Hauptgericht die beste Empfehlung „A“
        if(!!tl1_co2_bewertung_string && tl1_co2_bewertung_string==="A"){
            combinedMarkings.push(FoodTL1ParserOsnabrueck.getCO2RatingMarkingExternalIdentifier(tl1_co2_bewertung_string));
        }

        return combinedMarkings;
    }

    /**
     * Rating like A, B, C, D, E will be transformed to CO2_RATING_A, CO2_RATING_B, CO2_RATING_C, CO2_RATING_D, CO2_RATING_E
     * @param co2_bewertung_string
     */
    static getCO2RatingMarkingExternalIdentifier(co2_bewertung_string: string){
        return FoodTL1ParserOsnabrueck.CO2_BEWERTUNG_PREFIX_IDENTIFIER + co2_bewertung_string;
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
