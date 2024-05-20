import {CanteenGridList} from "@/compositions/resourceGridList/canteenGridList";
import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {router} from "expo-router";

export default function FoodOfferScreen() {

	function onSelectCanteen(canteen: Canteens){
		let canteen_id = canteen.id;
		router.push(`/(app)/foodweekplan/`+canteen_id);
	}

	return <CanteenGridList onPress={onSelectCanteen} />

}