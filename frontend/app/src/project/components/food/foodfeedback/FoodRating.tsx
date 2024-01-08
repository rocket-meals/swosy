import React, {FunctionComponent, useEffect} from "react";
import {Skeleton, Text, View} from "native-base";
import {useSynchedSettingsFoods} from "../../../helper/synchedJSONState";
import {FoodFeedbackAPI} from "./FoodFeedbackAPI";
import {FoodLoader} from "../FoodLoader";
import {FoodRatingSingle} from "./foodrating/FoodRatingSingle";
import {FoodRatingConstant} from "./foodrating/FoodRatingConstant";
import {FoodFeedbackHelper} from "../../../helper/FoodFeedbackHelper";

export enum RatingType{
	disabled="disabled",
	hearts = "hearts",
	likes = "likes",
	stars= "stars",
	smilies="smilies"
}
export interface AppState{
	food_id?: any,
	ratingType?: RatingType,
	userRating?: number,
	onSelectRating?: any
}
export const FoodRating: FunctionComponent<AppState> = (props) => {
	const food_id = props.food_id;

	const [synchedFeedbacks, setSynchedFeedbacks] = FoodFeedbackAPI.useSynchedFoodFeedbacks(food_id);
	const feedbacks = synchedFeedbacks || [];

	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods()
	const ratingType = props.ratingType || foodSettings?.ratings_type
	const foodratings_avg_display = props.foodratings_avg_display || foodSettings?.ratings_avg_display
	const foodratings_amount_display = props.foodratings_amount_display || foodSettings?.ratings_amount_display

	const others_users_avg_rating = calculateAvg(feedbacks);
	//	const avg_rating = food?.avg_rating; //TODO maybe use this instead of own calculation TODO implement calc. backend

	const others_users_avg_rating_with_fraction = !!others_users_avg_rating ? Number(others_users_avg_rating).toFixed(1) : "";

	const amountLikeRatings = getAmountLikes(feedbacks);
	const amountDislikeRatings = getAmountDislikes(feedbacks);

	async function load(){
		let reloadedFood = await FoodLoader.loadFoodDetails(food_id);
		setSynchedFeedbacks(reloadedFood?.feedbacks);
	}

	useEffect(() => {
		load();
	}, [props]);

	function getRatingValues(feedbacks){
		let ratingValues = [];
		if(!!feedbacks && feedbacks.length>0){
			for(let feedback of feedbacks){
				let rating = FoodFeedbackHelper.getRating(feedback);
				if(rating!==undefined && rating!==null){
					ratingValues.push(rating);
				}
			}
		}
		return ratingValues;
	}

	function getAmountLikes(feedbacks){
		let ratingValues = getRatingValues(feedbacks);
		let amountLikes = 0;
		for(let ratingValue of ratingValues){
			if(FoodRatingConstant.isRatingAbouveAvg(ratingValue)){
				amountLikes++;
			}
		}
		return amountLikes;
	}

	function getAmountDislikes(feedbacks){
		let ratingValues = getRatingValues(feedbacks);
		let amountDislikes = 0;
		for(let ratingValue of ratingValues){
			if(FoodRatingConstant.isRatingBelowAvg(ratingValue)){
				amountDislikes++;
			}
		}
		return amountDislikes;
	}

	function calculateAvg(feedbacks){
		if(!!feedbacks && feedbacks.length>0){
			let sum = 0;
			let amount = 0;
			for(let feedback of feedbacks){
				let rating = feedback?.rating;
				if(rating!==undefined && rating!==null){
					sum+=rating;
					amount++;
				}
			}
			let avg = sum/amount;
			return avg;
		} else {
			return undefined;
		}
	}

	function convertHumanReadableNumber(num){
		if(num>=1000){
			return num/1000+"k";
		}
		return num;
	}

	function renderSingleFoodRating(amountRatings, ratingType, ratingValue){
		let renderedAmount = null;
		if(foodratings_amount_display){
			renderedAmount = (
				<>
					<View style={{width: 18}}></View>
					<Text>{convertHumanReadableNumber(amountRatings)}</Text>
				</>
			)
		}

		return(
			<>
				<View style={{alignItems: "center", flexDirection: "row"}}>
					<FoodRatingSingle updateOtherValues={true} food_id={food_id} ratingValue={ratingValue} ratingType={ratingType} />
					{renderedAmount}
				</View>
				<View style={{width: 30}}></View>
			</>
		)
	}

	function renderOnlyLikes(){
		return renderSingleFoodRating(amountLikeRatings, RatingType.hearts, FoodRatingConstant.maxRatingValue)
	}

	function renderLikeAndDislike(){
		return [
				renderSingleFoodRating(amountLikeRatings, RatingType.likes, FoodRatingConstant.maxRatingValue),
				renderSingleFoodRating(amountDislikeRatings, RatingType.likes, FoodRatingConstant.minRatingValue)
		]
	}

	function renderSmily(ratingValue){
		return <FoodRatingSingle updateOtherValues={true} food_id={food_id} ratingValue={ratingValue} ratingType={RatingType.smilies} />
	}

	function renderStar(ratingValue){
		return <FoodRatingSingle updateOtherValues={true} food_id={food_id} ratingValue={ratingValue} ratingType={RatingType.stars} />
	}

	function renderAvg() {
		if(foodratings_avg_display){
			return(<Text>{"("+others_users_avg_rating_with_fraction+")"}</Text>)
		} else {
			return null;
		}
	}

	function renderMultipleSelections(itemRenderFunction){
		let renderedSelections = [];
		let steps = 1;
		for(let ratingValue=FoodRatingConstant.minRatingValue; ratingValue<=FoodRatingConstant.maxRatingValue; ratingValue+=steps){
			renderedSelections.push(
					itemRenderFunction(ratingValue)
			);
		}

		return (
			<>
				<View style={{flexDirection: "row"}}>
					{renderedSelections}
				</View>
				{renderAvg()}
			</>
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
			case RatingType.stars: return renderMultipleSelections(renderStar.bind(null));
			case RatingType.smilies: return renderMultipleSelections(renderSmily.bind(null));
			default: return null
		}
	}

	return(
			<View style={{flexDirection: "row", width: "100%", alignItems: "center"}}>
				{renderRatingType()}
			</View>
	)
}
