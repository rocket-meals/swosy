import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {Foods} from "@/helper/database/databaseTypes/types";
import {useSynchedProfileFoodFeedback} from "@/states/SynchedProfile";
import React from "react";
import {MyRatingButton, RatingType} from "@/components/buttons/MyRatingButton";

export const useFeedbackRatingType = (): RatingType => {
	const [appSettings] = useSynchedAppSettings();
	const ratingType = appSettings?.foods_ratings_type;
	let feedbackRatingType: RatingType = RatingType.disabled
	if(ratingType === 'favorite'){
		feedbackRatingType = RatingType.favorite
	} else if(ratingType === 'hearts'){
		feedbackRatingType = RatingType.hearts
	} else if(ratingType === 'likes'){
		feedbackRatingType = RatingType.likes
	} else if(ratingType === 'stars'){
		feedbackRatingType = RatingType.stars
	}
	return feedbackRatingType
}



/**
 *
 * @param food
 * @param showOnlyMax if true, only the max button is shown
 * @constructor
 */
export const FoodFeedbackRating = ({food, showOnlyMax}: {food: Foods, showOnlyMax: boolean}) => {
	let foods_ratings_type = useFeedbackRatingType();
	
	const usedFoodId = food.id;
	const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(usedFoodId);
	const rating: number | undefined | null = foodFeedback?.rating;

	return <MyRatingButton rating={rating} showOnlyMax={showOnlyMax} ratingType={foods_ratings_type} setRating={setRating} />
}