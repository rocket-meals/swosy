import React, {FunctionComponent, useEffect, useState} from "react";
import {FoodLoader} from "../../components/food/FoodLoader";
import {BaseTemplate} from "../../../kitcheningredients";
import {View, Text} from "native-base";
import {FoodListHeader} from "../../components/food/FoodListHeader";
import {FoodCardListComponent} from "../../components/food/FoodCardListComponent";
import {NotFound} from "../../components/animations/NotFound";
import {NoFoodOffersFound} from "../../components/food/NoFoodOffersFound";
import {AppTranslation} from "../../components/translations/AppTranslation";

export const FoodList: FunctionComponent = (props) => {

	const limitSearchResults = 24;
	const [foods, setFoods] = useState([]);

	async function load(){

	}

	function onUpload(){
		load();
	}

	function renderFoundMoreResults(){
		if(!!foods && foods.length >= limitSearchResults){
			return(
				<View style={{width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
					<AppTranslation id={"foodSearchFoundMoreResults"} />
				</View>
			)
		} else {
			return null;
		}
	}

	async function handleSearch(text, finishedTyping){
		if(!finishedTyping){
			setFoods(undefined);
		} else {
			if(!!text){
				setFoods(undefined);
				FoodLoader.searchFood(text, limitSearchResults).then(searchedFoods => {
					if(!!searchedFoods){
						let wrappedFoods = [];
						for(let i=0; i<searchedFoods.length && i<limitSearchResults; i++){
							let food = searchedFoods[i];
							wrappedFoods.push({
								food: food,
							});
						}
						setFoods(wrappedFoods);
					} else {
						setFoods(null);
					}
				}).catch(error => {
					setFoods(null);
				})
			} else {
				setFoods([]);
			}
		}
	}

	// corresponding componentDidMount
	useEffect(() => {
		load()
	}, [props?.route?.params])

	return(
		<View style={{width: "100%", height: "100%"}}>
			<BaseTemplate header={<FoodListHeader handleSearch={handleSearch} />} route={props?.route} >
				<FoodCardListComponent
					key={"FoodList"+JSON.stringify(foods)}
					errorComponent={ <NotFound />}
					nothingFoundComponent={[<NoFoodOffersFound />]}
					foodoffers={foods}
					onUpload={onUpload} />
				{renderFoundMoreResults()}
			</BaseTemplate>
		</View>
	)
}
