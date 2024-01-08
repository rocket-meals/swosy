import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {SettingsRow} from "../../settings/SettingsRow";
import {Navigation} from "../../../../kitcheningredients";
import {DateHelper} from "../../../helper/DateHelper";
import {FoodRatingDisplay} from "./FoodRatingDisplay";
import {SettingsRowNavigator} from "../../settings/SettingsRowNavigator";
import {FoodDetails} from "../../../screens/food/FoodDetails";
import {FoodFeedbackHelper} from "../../../helper/FoodFeedbackHelper";
import {PermissionHelper} from "../../../helper/PermissionHelper";

export interface AppState{
	feedback: any,
	navigateToFood?: boolean,
	leftContent?: any,
}
export const FoodFeedbackRow: FunctionComponent<AppState> = (props) => {

	const amountOfLines = 3;

	let isAdmin = PermissionHelper.isAdmin();

	const navigateToFood = props.navigateToFood ?? false;
	const feedback = props.feedback;
	const foods_id = feedback?.foods_id;
	let content = null;
	if(!!feedback?.comment){
		content = '"'+feedback?.comment+'"';
	}
	let renderedText = <Text italic={true} selectable={true} numberOfLines={amountOfLines}>{content}</Text>

	let date = FoodFeedbackHelper.getDate(feedback);
	let renderedDate = <Text sub={true}>{DateHelper.formatOfferDateToReadable(date, true, false)}</Text>
	let rightContent = <View>
		{renderedDate}
	</View>
	let customLeftContent = props.leftContent;
	let leftContent = (
		<View style={{flex: 1, alignItems: "center", flexDirection: "row"}}>
			{customLeftContent}
			<FoodRatingDisplay userRating={feedback?.rating} isActive={true} />
		</View>
	)

	if(navigateToFood){
		return (
			<View style={{flex: 1, width: "100%"}}>
				<SettingsRowNavigator leftContent={
					<View style={{flex: 1, flexDirection: "column", justifyContent: "space-between"}}>
						{renderedText}
						<View style={{alignItems: "flex-end"}}>
							{renderedDate}
						</View>
					</View>
				} rightIcon={null} leftIcon={leftContent} onPress={
					() => {
						Navigation.navigateTo(FoodDetails, {id: ""+foods_id, showbackbutton: true})
//						NavigatorHelper.navigateWithoutParams(FoodDetails, false, {id: ""+foods_id, showbackbutton: true});
					}
				} />
			</View>
		);
	}

	return (
		<View style={{flex: 1, width: "100%"}}>
			<SettingsRow leftContent={renderedText} leftIcon={leftContent} rightIcon={rightContent} />
		</View>
	);
}
