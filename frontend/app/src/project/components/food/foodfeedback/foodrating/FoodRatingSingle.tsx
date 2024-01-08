import React, {FunctionComponent, useEffect} from "react";
import {View} from "native-base";
import {TouchableOpacity} from "react-native";
import {FoodFeedbackAPI} from "../FoodFeedbackAPI";
import {useSynchedSettingsFoods} from "../../../../helper/synchedJSONState";
import {PermissionHelperComponent} from "../../../../helper/PermissionHelperComponent";
import {RatingType, RatingValueIcon} from "../../../ratings/RatingValueIcon";
import {useAppTranslation} from "../../../translations/AppTranslation";
import {MyTouchableOpacity} from "../../../buttons/MyTouchableOpacity";
import {ImageOverlayPaddingStyle} from "../../../imageOverlays/ImageOverlay";

export interface AppState{
	food_id: any,
	ratingValue?: number,
	defaultRatingValue?: number,
	ratingType?: RatingType,
	onSelectRating?: any,
	color?: string
}
export const FoodRatingSingle: FunctionComponent<AppState> = (props) => {

	const food_id = props.food_id;

	const [userRating, setUserRating] = FoodFeedbackAPI.useOwnFoodRating(food_id);


	const translationCurrently = useAppTranslation("currently")
	const translationLike = useAppTranslation("rating_like")
	const translationDislike = useAppTranslation("rating_dislike")


	const ratingValue = props.ratingValue || userRating || props?.defaultRatingValue;

	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods()
	const ratingType = props.ratingType || foodSettings?.ratings_type

	const maxRatingValue = 5;
	const minRatingValue = 1;
	const middleRatingValue = (maxRatingValue+minRatingValue)/2;

	const isActive = getIsActive();

	const accessibilityLabelCurrentState = isActive ? translationLike : translationDislike;
	const accessibilityLabel = translationCurrently+": "+accessibilityLabelCurrentState;

	async function load(){

	}

	useEffect(() => {
		load();
	}, [props]);

	function isUsersRatingSameAsRatingValue(){
		return ratingValue === userRating;
	}

	async function handleSelectRating(ratingValue, isActive){
		//console.log("handleSelectRating", ratingValue, isActive);
		if(isActive && isUsersRatingSameAsRatingValue()){ // if we click at the rating again, we will delete it instead
			ratingValue = null; //so a null value is correct
		}
		await setUserRating(ratingValue);
		if(!!props.onSelectRating){
			props.onSelectRating(ratingValue);
		}
		await load();
	}


	function isRatingBelowAvg(ratingValue) {
		if(ratingValue!==null && ratingValue !== undefined){
			return ratingValue<middleRatingValue;
		} else {
			return false;
		}
	}

	function isRatingAbouveAvg(ratingValue) {
		if(ratingValue!==null && ratingValue !== undefined){
			return ratingValue>=middleRatingValue;
		} else {
			return false;
		}
	}

	function isLikeRatingActive(){
		if(isRatingAbouveAvg(ratingValue)){
			return isRatingAbouveAvg(userRating);
		}
		return isRatingBelowAvg(userRating);
	}

	function getIsActive(): boolean {
		switch (ratingType){
			case RatingType.disabled: return false;
			case RatingType.hearts: return userRating===ratingValue || isRatingAbouveAvg(userRating);
			case RatingType.likes: return userRating===ratingValue || isLikeRatingActive();
			case RatingType.stars: return userRating>=ratingValue;
			case RatingType.smilies: return userRating>=ratingValue;
			default: return false
		}
	}

	function getIsRatingEnabled(): boolean {
		if(!ratingType){
			return false;
		}
		if(ratingType===RatingType.disabled){
			return false;
		}
		return true;
	}

	if(!getIsRatingEnabled()){
		return null;
	}

	return(
			<View>
				<PermissionHelperComponent collection={FoodFeedbackAPI.collection} fields={["rating"]} actions={["create", "update", "delete"]} >
					<MyTouchableOpacity
						accessibilityLabel={accessibilityLabel}
						style={ImageOverlayPaddingStyle}
						onPress={() => {
						handleSelectRating(ratingValue, isActive)
					}}>
						<View style={props?.style}>
							<RatingValueIcon color={props?.color} ratingType={ratingType} ratingValue={ratingValue} isActive={isActive} />
						</View>
					</MyTouchableOpacity>
				</PermissionHelperComponent>
			</View>
	)
}
