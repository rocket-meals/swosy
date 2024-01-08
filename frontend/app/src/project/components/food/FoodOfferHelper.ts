import {Foodoffers} from "../../directusTypes/types";
import {ProfileAPI} from "../profile/ProfileAPI";

export class FoodOfferHelper{

	static useFoodOfferPrice(foodoffer?: Foodoffers){
		const [priceGroup, setPriceGroup, priceGroups] = ProfileAPI.useSynchedPriceGroup();

		let defaultPrice = foodoffer?.price_student;
		let priceGroupInformation = priceGroups?.[priceGroup];
		let food_offer_field = priceGroupInformation?.food_offer_field;
		let food_offer_price = foodoffer?.[food_offer_field];

		return food_offer_price || defaultPrice;
	}

}
