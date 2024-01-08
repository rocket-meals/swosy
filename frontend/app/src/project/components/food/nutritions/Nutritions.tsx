import React, {FunctionComponent, useEffect, useState} from "react";
import {Foods} from "../../../directusTypes/types";
import {Divider, Text, View} from "native-base";
import {GridList} from "../../GridList";
import {Nutrition, NutritionKeys} from "./Nutrition";
import {Layout} from "../../../../kitcheningredients";


interface AppState {
	food: Foods,
}
export const Nutritions: FunctionComponent<AppState> = (props) => {

	//sugar: spoon-sugar //cube-outline
	//salt: shaker-outline

	let food = props.food;

	function renderCalories(){
		let value = food?.calories_kcal;
		let nutritionkey = NutritionKeys.calories_kcal;
		return(
			<Nutrition key={nutritionkey} nutritionkey={nutritionkey} value={value} />
		)
	}

	function renderNutritions(){
		let renderedNutritions = [];
		if(!food){
			return null;
		}
		let keys = Object.keys(food);
		let nutritionkeys = [];
		for(let key of keys){
			if(key.endsWith("_g")){
				nutritionkeys.push(key);
			}
		}

		renderedNutritions.push(renderCalories())
		for(let nutritionkey of nutritionkeys){
			let value = food[nutritionkey];
			renderedNutritions.push(<Nutrition key={nutritionkey} nutritionkey={nutritionkey} value={value} />);
		}

		return renderedNutritions;
	}

	let defaultBreakpoints = {
		base: 1,
		sm: 2,
		md: 3,
		lg: 4,
		xl: 5,
	}

	return(
		<>
			<GridList beakpointsColumns={defaultBreakpoints} paddingHorizontal={"0%"} paddingVertical={"0%"} divider={<Divider/>}>
				{renderNutritions()}
			</GridList>

		</>
	)
}
