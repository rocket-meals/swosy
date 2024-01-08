import React, {FunctionComponent, useEffect, useState} from "react";
import {FoodLoader} from "../../components/food/FoodLoader";
import {FoodOfferListComponent} from "../../components/food/FoodOfferListComponent";
import {BaseNoPaddingTemplate, Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {View} from "native-base";
import {DateHelper} from "../../helper/DateHelper";
import {FoodOfferListHeader} from "../../components/food/FoodOfferListHeader";
import {useSynchedProfile, useSynchedProfileCanteen} from "../../components/profile/ProfileAPI";
import {useDemoMode} from "../../helper/synchedJSONState";
import {UtilizationForecast} from "../../components/canteen/utilizationForecast/UtilizationForecast";

export const FoodOfferList: FunctionComponent = (props) => {

	let params = props?.route?.params;
	let paramcanteenId = params?.canteenid;
	let paramDate = params?.date;
	const [canteenId, setProfileCanteenId] = useSynchedProfileCanteen();
	const [demo, setDemo] = useDemoMode();

	//console.log("FoodOfferList: canteenId: " + canteenId);

	const [foodoffers, setFoodOffers] = useState(undefined);

	function checkParams(){
		if((paramcanteenId === undefined+"" || !paramcanteenId) && (paramDate===undefined+"" || !paramDate)){
			//console.log("FoodOfferList: canteenId and date not set");
			let formatedDate = DateHelper.formatToOfferDate(new Date());
			Navigation.navigateTo(FoodOfferList, {canteenid: 1, date: formatedDate})
//			NavigatorHelper.navigateWithoutParams(FoodOfferList, false, {canteenid: 1, date: formatedDate})
			return false;
		}
		return true;
	}

	async function load(){
		//console.log("FoodOfferList: load");
		if(checkParams()){
			//console.log("FoodOfferList: load: checkParams true");
			const date = new Date(paramDate);
			let newFoodOffers = await FoodLoader.getFoodOffers(date, canteenId);
			if(demo){
				const demofoodoffers = FoodLoader.getDemoFoodOffers();
				newFoodOffers = demofoodoffers;
			}
			setFoodOffers(newFoodOffers);
		}
	}

	function onUpload(){
		load();
	}

	// corresponding componentDidMount
	useEffect(() => {
		load()
	}, [props?.route?.params])

	if(!checkParams()){
		return null;
	}

	return(
		<View style={{width: "100%", height: "100%", flex: 1}}>
			<BaseNoPaddingTemplate header={
				<>
					<FoodOfferListHeader date={paramDate} canteenid={paramcanteenId} route={props?.route} />
				</>
			} route={props?.route} >
				<UtilizationForecast date={paramDate} canteenid={paramcanteenId} />
				<FoodOfferListComponent key={JSON.stringify(foodoffers)} foodoffers={foodoffers} onUpload={onUpload} />
			</BaseNoPaddingTemplate>
		</View>
	)
}
