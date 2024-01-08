import React, {FunctionComponent, useEffect, useState} from "react";
import {Text} from "native-base";
import {FoodLoader} from "./FoodLoader";
import {FoodImage} from "./FoodImage";
import {useFoodName} from "./FoodName";

export type FoodImageByIdProps = {
	id: string;
	hideManipulation?: boolean;
}
export const FoodImageById: FunctionComponent<FoodImageByIdProps> = (props) => {

	const [food, setFood] = useState(null);
	const foodName = useFoodName(food);
	const food_id = props?.id;

	async function load(){
		if(!!food_id){
			let foodDetails = await FoodLoader.loadFoodDetails(food_id);
			setFood(foodDetails);
		}
	}

	useEffect(() => {
		load();
	}, [props]);

	return (
			<FoodImage alt={foodName} hideManipulation={props?.hideManipulation} food={food} key={JSON.stringify(food)} onUpload={() => {}} />
	)

}
