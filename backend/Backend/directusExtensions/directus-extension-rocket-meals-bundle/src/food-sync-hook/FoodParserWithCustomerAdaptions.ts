import {
    CanteensTypeForParser,
    FoodoffersTypeForParser,
    FoodParserInterface,
    FoodsInformationTypeForParser
} from "./FoodParserInterface";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";

export class FoodParserWithCustomerAdaptions implements FoodParserInterface {

    private readonly foodParserInterface: FoodParserInterface;

    constructor(tl1FoodParser: FoodParserInterface) {
        this.foodParserInterface = tl1FoodParser;
    }

    async createNeededData(): Promise<void> {
        return await this.foodParserInterface.createNeededData();
    }

    async getCanteensList(): Promise<CanteensTypeForParser[]> {
        return await this.foodParserInterface.getCanteensList();
    }

    async getFoodoffersForParser(): Promise<FoodoffersTypeForParser[]> {
        let foodOffers = await this.foodParserInterface.getFoodoffersForParser();
        switch (EnvVariableHelper.getSyncForCustomer()) {
            case SyncForCustomerEnum.HANNOVER:
                foodOffers = this.adaptFoodOffersForCustomerHannover(foodOffers);
                break;
        }
        return foodOffers;
    }

    private adaptFoodOffersForCustomerHannover(foodOffers: FoodoffersTypeForParser[]): FoodoffersTypeForParser[] {
        // Some customer specific adaptions
        for (let foodOffer of foodOffers) {
            let basicFoodofferData = foodOffer.basicFoodofferData;
            basicFoodofferData.fiber_g = null; // 09.08.2024 - Die Ballaststoffe können wir so nicht auszeichnen, da wir keine sicheren Werte haben. Also bitte die Ballaststoffe bei den Nährwerten komplett rausnehmen. Auch nicht nur dann anzeigen lassen, wenn Werte hinterlegt sind, sondern komplett raus. Sonst haben wir eine fehlerhafte Auszeichnung.
            foodOffer.basicFoodofferData = basicFoodofferData;
        }

        return foodOffers;
    }

    async getFoodsListForParser(): Promise<FoodsInformationTypeForParser[]> {
        let foodList = await this.foodParserInterface.getFoodsListForParser();
        switch (EnvVariableHelper.getSyncForCustomer()) {
            case SyncForCustomerEnum.HANNOVER:
                foodList = this.adaptFoodsListForCustomerHannover(foodList);
                break;
        }
        return foodList;
    }

    private adaptFoodsListForCustomerHannover(foodList: FoodsInformationTypeForParser[]): FoodsInformationTypeForParser[] {
        // Some customer specific adaptions
        for (let food of foodList) {
            let basicFoodData = food.basicFoodData;
            basicFoodData.fiber_g = null; // 09.08.2024 - Die Ballaststoffe können wir so nicht auszeichnen, da wir keine sicheren Werte haben. Also bitte die Ballaststoffe bei den Nährwerten komplett rausnehmen. Auch nicht
            food.basicFoodData = basicFoodData;
        }
        return foodList;
    }

}
