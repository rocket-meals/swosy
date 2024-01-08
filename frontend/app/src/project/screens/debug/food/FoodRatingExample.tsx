import React, {FunctionComponent, useEffect, useState} from "react";
import {Input, Text, View} from "native-base";
import {FoodDetailsComponent} from "../../../components/food/FoodDetailsComponent";
import {FoodLoader} from "../../../components/food/FoodLoader";
import {FoodRating, RatingType} from "../../../components/food/foodfeedback/FoodRating";
import {MyThemedBox} from "../../../../kitcheningredients"

export const FoodRatingExample: FunctionComponent = (props) => {

	const [foodId, setFoodId] = useState("");
	const [food, setFood] = useState(FoodLoader.getDemoFoodDetails("Demo Food"));
	const [userRating, setUserRating] = useState(5);

	async function load(){
		try{
			let answer = await FoodLoader.loadFoodDetails(foodId);
			setFood(answer);
		} catch (err){
			//console.log(err);
		}
	}

	// corresponding componentDidMount
	useEffect(() => {
		load()
	}, [foodId])

	function setRatingCallback(newRating){
		setUserRating(newRating)
	}

	function renderFoodRating(ratingType){
		return (
			<MyThemedBox key={"food_rating"+ratingType} _shadeLevel={3} style={{paddingVertical: "1%", paddingHorizontal: "1%"}}>
				<FoodRating key={userRating+""} food_id={food?.id} ratingType={ratingType} userRating={userRating} onSelectRating={setRatingCallback.bind(null)} />
			</MyThemedBox>
		)
	}

	function renderFoodRatings(){
		let output = [];
		for(let ratingType of Object.keys(RatingType)){
			output.push(renderFoodRating(ratingType));
		}

		return output;
	}

	return(
		<>
			<View style={{width: "100%"}}>
				<Text>{"Food ID"}</Text>
				<Input style={{width: "100%"}} value={foodId} onChangeText={(newId) => {setFoodId(newId)}} />
				{renderFoodRatings()}
				<Text>{JSON.stringify(food)}</Text>
			</View>
		</>
	)
}
