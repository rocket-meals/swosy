import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base";
import {FoodDetailsComponent} from "../../components/food/FoodDetailsComponent";
import {FoodLoader} from "../../components/food/FoodLoader";
import {Layout} from "../../../kitcheningredients";
import {useDemoMode} from "../../helper/synchedJSONState";
import {FoodOfferHelper} from "../../components/food/FoodOfferHelper";

export const FoodDetails: FunctionComponent = (props) => {

	const [food, setFood] = useState(null);
	const [foodOffer, setFoodOffer] = useState(null);
	const [demo, setDemo] = useDemoMode();

	async function load(){
		let foodoffer_id = props?.route?.params?.foodoffer_id;
		//console.log("FoodDetails: params: foodoffer_id: " + foodoffer_id);
		let id = props?.route?.params?.id;
		//console.log("FoodDetails: params: id: " + id);

		if(!!foodoffer_id){
			//console.log("FoodDetails: load: foodoffer_id: " + foodoffer_id);
			let downloadedFoodOffer = undefined;
			try{
				downloadedFoodOffer = await FoodLoader.loadFoodOffer(foodoffer_id);
			} catch (err){
				downloadedFoodOffer = null;
				//console.log("FoodDetails: load: err: " + err);
			}
			if(demo){
				//console.log("FoodDetails: load: demo: ");
				downloadedFoodOffer = await FoodLoader.getDemoFoodOffer(foodoffer_id);
			}

			setFoodOffer(downloadedFoodOffer);
		}

		if(!!id){
			//console.log("FoodDetails: load: id: " + id);
			let downloadedFood = undefined;
			try{
				downloadedFood = await FoodLoader.loadFoodDetails(id);
			} catch (err){
				downloadedFood = null;
				//console.log("FoodDetails: load: err: " + err);
			}
			if(demo){
				downloadedFood = await FoodLoader.getDemoFoodDetails(id);
			}
			setFood(downloadedFood);
		}
	}

	// corresponding componentDidMount
	useEffect(() => {
		load()
	}, [props?.route?.params])

	if(!food){
		return(
			<>
				<Text>FoodDetails: loading...</Text>
			</>
		)
	}

	return(
		<>
			<View style={{width: "100%", paddingTop: Layout.padding}}>
				<FoodDetailsComponent key={JSON.stringify(food)} food={food} foodOffer={foodOffer} onUpload={load} />
			</View>
		</>
	)
}
