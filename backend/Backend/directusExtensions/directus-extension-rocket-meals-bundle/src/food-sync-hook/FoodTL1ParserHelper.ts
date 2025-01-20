import {FoodoffersTypeForParser, FoodsInformationTypeForParser} from "./FoodParserInterface";

export class FoodTL1ParserHelper {

    static adaptFoodsListRemoveFiber(foodList: FoodsInformationTypeForParser[]): FoodsInformationTypeForParser[] {
        // Some customer specific adaptions
        for (let food of foodList) {
            let basicFoodData = food.basicFoodData;
            basicFoodData.fiber_g = null; // 09.08.2024 - Die Ballaststoffe können wir so nicht auszeichnen, da wir keine sicheren Werte haben. Also bitte die Ballaststoffe bei den Nährwerten komplett rausnehmen. Auch nicht
            food.basicFoodData = basicFoodData;
        }
        return foodList;
    }

    static adaptFoodOffersRemoveFiber(foodOffers: FoodoffersTypeForParser[]): FoodoffersTypeForParser[] {
        // Some customer specific adaptions
        for (let foodOffer of foodOffers) {
            let basicFoodofferData = foodOffer.basicFoodofferData;
            basicFoodofferData.fiber_g = null; // 09.08.2024 - Die Ballaststoffe können wir so nicht auszeichnen, da wir keine sicheren Werte haben. Also bitte die Ballaststoffe bei den Nährwerten komplett rausnehmen. Auch nicht nur dann anzeigen lassen, wenn Werte hinterlegt sind, sondern komplett raus. Sonst haben wir eine fehlerhafte Auszeichnung.
            foodOffer.basicFoodofferData = basicFoodofferData;
        }

        return foodOffers;
    }

    static adaptFoodsListRemoveBasicFoodDataFields(foodList: FoodsInformationTypeForParser[], fields: string[]): FoodsInformationTypeForParser[] {
        // Some customer specific adaptions
        for (let food of foodList) {
            let basicFoodData = food.basicFoodData;
            for (let field of fields) {
                // @ts-ignore
                basicFoodData[field] = null;
            }
            food.basicFoodData = basicFoodData;
        }
        return foodList;
    }

    static adaptFoodOffersRemoveBasicFoodofferDataFields(foodOffers: FoodoffersTypeForParser[], fields: string[]): FoodoffersTypeForParser[] {
        // Some customer specific adaptions
        for (let foodOffer of foodOffers) {
            let basicFoodofferData = foodOffer.basicFoodofferData;
            for (let field of fields) {
                // @ts-ignore
                basicFoodofferData[field] = null;
            }
            foodOffer.basicFoodofferData = basicFoodofferData;
        }

        return foodOffers;
    }

}
