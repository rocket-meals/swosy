import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";
import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {router} from "expo-router";
import {SEARCH_PARAM_CANTEENS_ID} from "@/app/(app)/foodoffers/weekplan/canteens";

export default function FoodOfferScreen() {

	function onSelectCanteen(canteen: Canteens){
		let canteen_id = canteen.id;
		router.push(`/(app)/foodoffers/weekplan/canteens/?${SEARCH_PARAM_CANTEENS_ID}=`+canteen_id);
	}

	return <CanteenGridList onPress={onSelectCanteen} />

}