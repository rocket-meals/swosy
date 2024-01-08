import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {Nutritions} from "./nutritions/Nutritions";
import {SettingsRow} from "../settings/SettingsRow";
import {NutritionIcon} from "./nutritions/NutritionIcon";
import {BasePadding, MyThemedBox, useThemedShade} from "../../../kitcheningredients"
import {SettingsSpacer} from "../settings/SettingsSpacer";
import {FoodCard} from "./FoodCard";
import {Icon, Navigation, NavigatorHelper} from "../../../kitcheningredients";
import {FoodRating} from "./foodfeedback/FoodRating";
import {CommentType, FoodCommentsComponent} from "./foodfeedback/FoodCommentsComponent";
import {useDebugMode, useSynchedMarkingsDict, useSynchedSettingsFoods} from "../../helper/synchedJSONState";
import {Foodoffers, Foods} from "../../directusTypes/types";
import {ImageFullscreen} from "../../screens/other/ImageFullscreen";
import {countDislikedMarkings, useSynchedProfileMarkingsDict} from "../profile/MarkingAPI";
import {AppTranslation, useAppTranslation} from "../translations/AppTranslation";
import {MarkingSetting} from "../marking/MarkingSetting";
import {NotificationItem} from "../notification/NotificationItem";
import {DetailsComponentMenus} from "../detailsComponent/DetailsComponentMenus";
import {DebugIcon} from "../icons/DebugIcon";
import {ProfileAPI} from "../profile/ProfileAPI";
import {FoodOfferHelper} from "./FoodOfferHelper";
import {ColorHelper} from "../../helper/ColorHelper";
import {CommonSystemActionHelper} from "../../helper/SystemActionHelper";
import {MarkingIcon} from "../marking/MarkingIcon";
import {FoodFeedbackAPI} from "./foodfeedback/FoodFeedbackAPI";

export interface AppState{
	food?: any,
	foodOffer?: any,
	onUpload?: any,
}
export const FoodDetailsComponent: FunctionComponent<AppState> = (props) => {

	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods()

	const buttonColor = ColorHelper.useProjectColor();
	let buttonTextColor = ColorHelper.useContrastColor(buttonColor)

	const translationNoGuarantee = useAppTranslation("foodMarkingNoGuarantee");

	const shadeLevel = 3;
	const shadeBackgroundColor = useThemedShade(shadeLevel);
	const shadeTextColor = ColorHelper.useContrastColor(shadeBackgroundColor);

	const [allMarkingsDict, setAllMarkingsDict] = useSynchedMarkingsDict();
	const [debug, setDebug] = useDebugMode()
	const foodcommentstype = props.foodcommentstype || foodSettings?.comments_type

	const food : Foods = props?.food;
	const foodoffer : Foodoffers = props?.foodOffer;

	const [notifyForFood, setNotifyForFood] = FoodFeedbackAPI.useOwnFoodNotify(food?.id);

	const foodMarkings = foodoffer?.markings || food?.markings || [];
	const markingAmount = foodMarkings.length;

	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const amountOfDislikedMarkings = countDislikedMarkings(foodMarkings, profilesMarkingsDict);
	const isDislikedMarking = amountOfDislikedMarkings > 0;

	const commentsMenuKey = "comments";

	const menus = {
		"nutritions": {
			element: <Nutritions food={food} />,
			renderIcon: (backgroundColor, textColor) => { return <NutritionIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return <AppTranslation id={"nutritions"} color={textColor} />},
		},
		"markings": {
			element: renderMarkings(),
			renderIcon: (backgroundColor, textColor) => { return <MarkingIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return <AppTranslation id={"markings"} color={textColor} />},
			color: isDislikedMarking ? "red" : undefined,
			activeColor: isDislikedMarking ? "darkred" : undefined,
			amount: markingAmount
		},
		"comments": {
			element: renderComments(),
			renderIcon: (backgroundColor, textColor) => { return <Icon name={"chat"} color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return <AppTranslation id={"comments"} color={textColor} />},
		},
	}

	if(debug){
		menus["Debug"] = {
			element: renderDebug(),
			renderIcon: (backgroundColor, textColor) => { return <DebugIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return <AppTranslation id={"debug"} color={textColor} />},
		};
	}

	if(!foodcommentstype || foodcommentstype===CommentType.disabled){
		delete menus[commentsMenuKey];
	}

	function renderDebug(){
		let output = [];
		output.push(<SettingsRow leftIcon={"tag"} leftContent={<Text>{"ID: "+food?.id}</Text>} />)
		output.push(<SettingsRow leftIcon={"code-braces"} leftContent={<View style={{flexDirection:'row', flex: 1}}><Text style={{flex: 1, flexWrap: 'wrap'}}>{"Food:\n"}{JSON.stringify(food, null, 2)}</Text></View>} />)
		output.push(<SettingsRow leftIcon={"code-braces"} leftContent={<View style={{flexDirection:'row', flex: 1}}><Text style={{flex: 1, flexWrap: 'wrap'}}>{"Foodoffer:\n"}{JSON.stringify(foodoffer, null, 2)}</Text></View>} />)

		return(
			output
		)
	}

	function renderComments(){
		return <FoodCommentsComponent food_id={food?.id} />
	}

	function renderMarkings(){
		let output = [];
		for(let foodMarking of foodMarkings){
			let markingId = foodMarking?.markings_id;
			let marking = allMarkingsDict[markingId];
			output.push(<MarkingSetting marking={marking} />)
		}

		return(
			output
		)
	}

	function renderRating(){
		return(
				<FoodRating food_id={food?.id} />
		)
	}

	function renderNotification(){
		console.log("renderNotification", notifyForFood)

		return(
			<NotificationItem textColor={shadeTextColor} active={notifyForFood} onPress={(nextValue => {
				setNotifyForFood(nextValue);
			})} />
		)
	}

	function renderActionRow(){
		return(
			<MyThemedBox key={"food_rating"} _shadeLevel={3} style={{paddingVertical: "1%", paddingHorizontal: "1%"}}>
				<View style={{width: "100%", flexDirection: "row", justifyContent: "space-between"}}>
					<View>
						{renderRating()}
					</View>
					{renderNotification()}
				</View>
			</MyThemedBox>
		)
	}


	function onPress(){
		let id = food?.id;
		let assetId = food?.image;
		if(!!id && !!assetId){
			//TODO Refactor FoodImageFullscreen into FullscreenImage and pass only the assetId
			Navigation.navigateTo(ImageFullscreen, {id: assetId, showbackbutton: true})
//			NavigatorHelper.navigateWithoutParams(ImageFullscreen, false, {id: assetId, showbackbutton: true});
		}
	}

	return(
		<>
			<View style={{width: "100%"}}>
				<FoodCard small={false} onUpload={props?.onUpload} key={JSON.stringify(food)} food={food} foodoffer={foodoffer} hideBottomPartAndQuickRate={true} onPress={onPress}  />
				{renderActionRow()}
				<SettingsSpacer />
				<DetailsComponentMenus menus={menus} />
				<SettingsSpacer />
				<BasePadding>
					<Text italic={true} >{translationNoGuarantee}</Text>
				</BasePadding>
			</View>
		</>
	)
}
