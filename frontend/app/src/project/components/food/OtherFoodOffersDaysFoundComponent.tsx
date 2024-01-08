import React, {FunctionComponent, useEffect, useState} from "react";
import Rectangle from "../../helper/Rectangle";
import {
	CrossLottie,
	Icon,
	KitchenSkeleton,
	Layout,
	MyThemedBox, Navigation,
	NavigatorHelper,
	useSynchedState
} from "../../../kitcheningredients";
import {useBreakpointValue, View, Text} from "native-base";
import noFoodOffersFound from "../../assets/noFoodOffersFound.json";
import {StorageKeys} from "../../helper/synchedVariables/StorageKeys";
import {FoodLoader} from "./FoodLoader";
import {DateHelper} from "../../helper/DateHelper";
import {TouchableOpacity} from "react-native";
import {FoodOfferList} from "../../screens/food/FoodOfferList";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";
import {StringHelper} from "../../helper/StringHelper";
import {AppTranslation} from "../translations/AppTranslation";
import {useProfileLanguageCode} from "../translations/DirectusTranslationUseFunction";
import {ColorHelper} from "../../helper/ColorHelper";
import {MyTouchableOpacityForNavigation} from "../buttons/MyTouchableOpacityForNavigation";

export interface AppState{
	canteenId: string,
	amountDays: number,
}
export const OtherFoodOffersDaysFoundComponent: FunctionComponent<AppState> = (props: any) => {

	const profileLocal = useProfileLanguageCode();

	const defaultColor = props?.defaultColor || ColorHelper.useProjectColor();
	const defaultTextColor = props?.defaultTextColor || ColorHelper.useContrastColor(defaultColor);

	let canteenId = props.canteenId;
	let amountDays = props.amountDays;
	let future = amountDays >= 0;

	if(!canteenId || amountDays===undefined || amountDays===null){
		return null;
	}

	const [nearestOfferDate, setNearestOfferDate] = useState(undefined);
	let dateFound = !!nearestOfferDate;

	async function load(){
		let today = new Date();

		let newFoodOffersNextDays = await FoodLoader.getFoodOffers(today, canteenId, amountDays);
		if(!!newFoodOffersNextDays){
			let foodsByDateDict = {};
			for(let offer of newFoodOffersNextDays){
				let date = offer?.date;
				if(!!date){
					date = date + ".000Z"; // format to UTC Time

					let foodsByDate = foodsByDateDict[date] || [];
					foodsByDate.push(offer);
					foodsByDateDict[date] = foodsByDate;
				}
			}
			let keys = Object.keys(foodsByDateDict);
			let sortedDates = DateHelper.sortDates(keys);

			if(!!sortedDates){
				let nextDate
				if(future){
					nextDate = sortedDates[0];
				} else {
					nextDate = sortedDates[sortedDates.length-1];
				}
				if(!!nextDate){
					setNearestOfferDate(DateHelper.formatToOfferDate(nextDate));
					return;
				}
			}
		}
		setNearestOfferDate(null);
		return;
	}

	useEffect(() => {
		load();
	}, [props])

	function renderIcon(){
		let icon = future ? "arrow-right" : "arrow-left";
		if(!dateFound){
			icon = "close"
		}
		return <Icon color={defaultTextColor} name={icon} />
	}


	function getTextNoFoodsFound(){
		let amountDaysAbs = Math.abs(amountDays);
		if(future){
			return <View style={{alignItems: "center"}}><AppTranslation color={defaultTextColor} id={"noOffersFoundInTheNextDays"} params={{"%d": amountDaysAbs}} /></View>
		} else {
			return <View style={{alignItems: "center"}}><AppTranslation color={defaultTextColor}  id={"noOffersFoundInTheLastDays"} params={{"%d": amountDaysAbs}} /></View>;
		}
	}

	function getTextNearest(){
		if(future){
			return <AppTranslation color={defaultTextColor}  id={"nextOffersFoundFor"} postfix={":"} />;
		} else {
			return <AppTranslation color={defaultTextColor}  id={"previousOffersFoundFor"} postfix={":"} />;
		}
	}

	function renderLoadingContent(){
		return (
			<View style={{flex: 1}}>
				<View><Text color={"transparent"}>{DateHelper.formatOfferDateToReadable(new Date(), true)}</Text></View>
				<ViewPercentageBorderradius style={{borderRadius: "10%", position: "absolute", width: "100%", height: "100%", overflow: "hidden"}} >
					<KitchenSkeleton flex={1} />
				</ViewPercentageBorderradius>
			</View>
		)
	}

	function renderContent(){
		if(!dateFound){
			return getTextNoFoodsFound()
		} else {
			let text = renderLoadingContent();
			if(dateFound){
				let date = new Date(nearestOfferDate);
				let locale = profileLocal || "en-us";
				let dayName = date.toLocaleDateString(locale, { weekday: 'long' });

				text = <Text color={defaultTextColor} >{dayName+" "+DateHelper.formatOfferDateToReadable(nearestOfferDate)+""}</Text>;
			}
			return(
				<View style={{width: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
					{getTextNearest()}
					{text}
				</View>
			);
		}


	}

	return (
		<View style={{flex: 1}}>
			<ViewPercentageBorderradius style={{borderRadius: "5%", overflow: "hidden", backgroundColor: defaultColor}} >
					<MyTouchableOpacityForNavigation
						disabled={!dateFound} onPress={() => {
						Navigation.navigateTo(FoodOfferList, {canteenid: canteenId, date: nearestOfferDate});
//						NavigatorHelper.navigateWithoutParams(FoodOfferList, false, {canteenid: canteenId, date: nearestOfferDate})
					}}>
						<View style={{alignItems: "center", justifyContent: "center", margin: 10}}>
							{renderIcon()}
							{renderContent()}
						</View>
					</MyTouchableOpacityForNavigation>
			</ViewPercentageBorderradius>
		</View>
	)
}
