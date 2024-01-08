import React, {FunctionComponent} from "react";
import {Icon, Navigation} from "../../../kitcheningredients";
import {Button, Text, Tooltip, View} from "native-base";
import {DateHelper} from "../../helper/DateHelper";
import {CanteenIcon} from "../../components/canteen/CanteenIcon";
import {MarkingIcon} from "../marking/MarkingIcon";
import {FoodOfferList} from "../../screens/food/FoodOfferList";
import {SettingMarking} from "../../screens/settings/SettingMarking";
import {SettingCanteen} from "../../screens/settings/SettingCanteen";
import {FoodList} from "../../screens/food/FoodList";
import {SimpleDatePicker} from "../datePicker/SimpleDatePicker";
import {SwitchIcon} from "../icons/SwitchIcon";
import {useDemoMode, useSynchedSettingsFoods} from "../../helper/synchedJSONState";
import {useAppTranslation} from "../translations/AppTranslation";
import {HeaderWithActions} from "../../../kitcheningredients";
import {ProfileAPI, useSynchedProfile} from "../profile/ProfileAPI";
import {PriceGroupIcon} from "../icons/PriceGroupIcon";
import {SettingPriceGroup} from "../../screens/settings/SettingPriceGroup";
import {UtilizationForecast} from "../canteen/utilizationForecast/UtilizationForecast";

export interface AppState{
	canteenid?: number,
	date?: any,
	route: any
}
export const FoodOfferListHeader: FunctionComponent<AppState> = (props) => {

	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods()

	const [demo, setDemo] = useDemoMode();

	const utilization_forecast_enabled = foodSettings?.utilization_forecast_enabled; // TODO: Implement Feature forecast

	const translationDay = useAppTranslation("day");
	const translationSearch = useAppTranslation("search");
	const translationFoods = useAppTranslation("foods");
	const translationSearchFoods = translationSearch + ": " + translationFoods;
	const translationSettingMarking = useAppTranslation("settingmarking");
	const translationSettingCanteen = useAppTranslation("settingcanteen");
	const translationSettingPriceGroup = useAppTranslation("price_group");

	const [profile, setProfile] = useSynchedProfile();
	let locale = ProfileAPI.getLocaleForJSDates(profile);

	let paramcanteenId = props?.canteenid;
	if(demo){
		paramcanteenId = 1;
	}
	let paramDate = props?.date;

	function changeDate(nextDate){
		let formattedDate = DateHelper.formatToOfferDate(nextDate);
		Navigation.navigateTo(FoodOfferList, {canteenid: paramcanteenId, date: formattedDate})
//		NavigatorHelper.navigateWithoutParams(FoodOfferList, false, {canteenid: paramcanteenId, date: formattedDate})
	}

	function renderSwitchDate(forward: boolean){
		let nextDate = new Date(paramDate);
		let skipAmountDays = forward? 1 : -1;
		nextDate = DateHelper.addDays(nextDate, skipAmountDays)

		return <SwitchIcon accessibilityName={translationDay} forward={forward} onPress={() => {
			changeDate(nextDate)
		}} />
	}

	function getTitleString(){
		if(!!paramDate){
			let asDate = new Date(paramDate);
			return DateHelper.useSmartReadableDate(asDate, locale);
		}
		return null; //Render null to let more space for icons and buttons
	}

	function renderSelectedDate(){

		const formatedSelectedDate = DateHelper.formatOfferDateToReadable(paramDate)

		return (
			<SimpleDatePicker currentDate={paramDate} onSelectDate={(nextDate) => {
				//console.log("On Select next Date In Header");
				//console.log(nextDate);
				changeDate(nextDate);
			}}>
				<View style={{flexDirection: "row", alignItems: "center", justifyContent: "center"}}>
					<Icon name={"calendar-month-outline"} />
					<Text>{formatedSelectedDate}</Text>
				</View>
			</SimpleDatePicker>

		)
	}

	function renderActions(){
		return(
			<>
				<Tooltip label={translationSearchFoods}>
					<Button style={{backgroundColor: "transparent"}}
							onPress={() => {
								Navigation.navigateTo(FoodList, {showbackbutton: true})
//								NavigatorHelper.navigateWithoutParams(FoodList, false, {showbackbutton: true});
							}}>
						<Icon name={"magnify"} accessibilityLabel={translationSearchFoods} />
					</Button>
				</Tooltip>
				<Tooltip label={translationSettingMarking}>
					<Button style={{backgroundColor: "transparent"}} accessibilityLabel={translationSettingMarking} onPress={() => {
						Navigation.navigateTo(SettingMarking, {showbackbutton: true})
//						NavigatorHelper.navigateWithoutParams(SettingMarking, false, {showbackbutton: true});
					}}>
						<MarkingIcon />
					</Button>
				</Tooltip>
				<Tooltip label={translationSettingCanteen}>
					<Button style={{backgroundColor: "transparent"}} onPress={() => {
						Navigation.navigateTo(SettingCanteen, {showbackbutton: true})
//						NavigatorHelper.navigateWithoutParams(SettingCanteen, false, {showbackbutton: true});
					}}>
						<CanteenIcon accessibilityLabel={translationSettingCanteen} />
					</Button>
				</Tooltip>
				<Tooltip label={translationSettingPriceGroup}>
					<Button style={{backgroundColor: "transparent"}} onPress={() => {
						Navigation.navigateTo(SettingPriceGroup, {showbackbutton: true})
//						NavigatorHelper.navigateWithoutParams(SettingCanteen, false, {showbackbutton: true});
					}}>
						<PriceGroupIcon accessibilityLabel={translationSettingPriceGroup} />
					</Button>
				</Tooltip>
			</>
		)
	}

	function renderCustomBottom(){
		return(
			<>
				<View style={{flex: 1}}>
					<View style={{flex: 1}}>

					</View>
					<View style={{justifyContent: "center", alignItems: "center", flexDirection: "row"}}>
						{renderSwitchDate(false)}
						{renderSelectedDate()}
						{renderSwitchDate(true)}
					</View>
					<View style={{flex: 1}}>

					</View>

				</View>
			</>
		)
	}

	return(
		<HeaderWithActions route={props?.route} title={getTitleString()} renderActions={renderActions} renderCustomBottom={renderCustomBottom} />
	)
}
