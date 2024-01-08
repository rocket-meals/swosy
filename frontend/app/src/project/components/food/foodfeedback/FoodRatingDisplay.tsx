import React, {FunctionComponent} from "react";
import {Skeleton, View} from "native-base";
import {Icon, TextWithIcon} from "../../../../kitcheningredients";
import {useSynchedSettingsFoods} from "../../../helper/synchedJSONState";
import {FoodRatingConstant} from "./foodrating/FoodRatingConstant";

export enum RatingType{
	disabled="disabled",
	hearts = "hearts",
	likes = "likes",
	stars= "stars",
	smilies="smilies"
}
export interface AppState{
	userRating?: number,
	text?: any,
	isActive?: boolean,
}
export const FoodRatingDisplay: FunctionComponent<AppState> = (props) => {

	if(props.userRating === undefined || props.userRating === null){
		return <Icon style={{color: "transparent"}} name={"thumb-up"} />; //render placeholder
	}

	const userRating = props.userRating;
	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods()
	const ratingType = props.ratingType || foodSettings?.ratings_type


	function renderOnlyLikes(){
		let icon = FoodRatingConstant.isRatingAbouveAvg(userRating) ? "heart" : "heart-outline";
		return (
			<View style={{flexDirection: "row", width: "100%"}}>
				<Icon name={icon}>{props.text}</Icon>
			</View>
		)
	}

	function renderLikeAndDislike(){
		if(FoodRatingConstant.isRatingAbouveAvg(userRating)){
			return(
				<View style={{flexDirection: "row", width: "100%"}}>
					<Icon name={"thumb-up"}>{props.text}</Icon>
				</View>
			)
		} else {
			return (
				<View style={{flexDirection: "row", width: "100%"}}>
					<Icon name={"thumb-down"}>{props.text}</Icon>
				</View>
			)
		}
	}

	function renderSmily(ratingValue){
		let smily_5 = "emoticon";
		let smily_4 = "emoticon-happy";
		let smily_3 = "emoticon-neutral";
		let smily_2 = "emoticon-sad";
		let smily_1 = "emoticon-cry";

		let name = "emoticon-cool";

		switch (ratingValue){
			case 5: name = smily_5; break;
			case 4: name = smily_4; break;
			case 3: name = smily_3; break;
			case 2: name = smily_2; break;
			case 1: name = smily_1; break;
		}

		if(!props.isActive){
			name+="-outline";
		}

		return(
			<Icon name={name}>{props?.text}</Icon>
		)
	}

	function renderStar(ratingValue){
		let name = "star-outline";
		if(props.isActive){
			name = "star";
		}

		return(
			<TextWithIcon icon={name}>{props?.text || ratingValue}</TextWithIcon>
		)
	}

	function renderRatingType(){
		if(!foodSettings && !ratingType){
			return <Skeleton />
		}

		switch (ratingType){
			case RatingType.disabled: return null;
			case RatingType.hearts: return renderOnlyLikes();
			case RatingType.likes: return renderLikeAndDislike();
			case RatingType.stars: return renderStar(userRating);
			case RatingType.smilies: return renderSmily(userRating);
			default: return null
		}
	}

	return renderRatingType()
}
