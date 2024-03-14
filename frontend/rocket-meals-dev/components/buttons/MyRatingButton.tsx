import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {MyButton} from "@/components/buttons/MyButton";
import {View} from "@/components/Themed";
import React from "react";

export enum RatingType{
	disabled='disabled',
	favorite='favorite',
	hearts = 'hearts',
	likes = 'likes',
	stars= 'stars'
}


/**
 * The raw rating component, without any context or food specific logic
 * @param rating the rating
 * @param showOnlyMax if true, only the max button is shown
 * @param ratingType the rating type
 * @param setRating the callback to set the rating
 * @param borderRadius the border radius
 * @constructor
 */
export const MyRatingButton = ({rating, showOnlyMax, ratingType, setRating, borderRadius}: {borderRadius?: number, rating: number | undefined | null, showOnlyMax: boolean, ratingType: RatingType, setRating: (rating: number | null) => void}) => {
	let foods_ratings_type = ratingType
	const translation_set_rating_to = useTranslation(TranslationKeys.set_rating_to);
	const translation_reset_rating = useTranslation(TranslationKeys.reset_rating);
	const translation_set_rate_as_favorite = useTranslation(TranslationKeys.set_rate_as_favorite);
	const translation_set_rate_as_not_favorite = useTranslation(TranslationKeys.set_rate_as_not_favorite);

	if(foods_ratings_type === RatingType.disabled){
		return null;
	}

	let renderedOptions = [];

	const MAX_RATING = 5;
	const MIN_RATING = 1;

	if(foods_ratings_type === RatingType.favorite || foods_ratings_type === RatingType.hearts){
		let isActive = rating === MAX_RATING;
		let icon = isActive ? IconNames.favorite_active_icon : IconNames.favorite_inactive_icon
		if(foods_ratings_type === RatingType.hearts){
			icon = isActive ? IconNames.heart_active_icon : IconNames.heart_inactive_icon
		}

		let accessibilityLabel = isActive ? translation_reset_rating : translation_set_rate_as_favorite;

		renderedOptions.push(
			<MyButton borderRadius={borderRadius} isActive={rating === MAX_RATING} onPress={() => {
				if(isActive){
					setRating(null)
				} else {
					setRating(MAX_RATING)
				}
			}} accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={icon} />
		)
	}
	if(foods_ratings_type === RatingType.likes){
		let isLikeActive = rating === MAX_RATING;
		const isDislikeActive = rating === MIN_RATING
		let dislike_icon = isDislikeActive ? IconNames.dislike_active_icon : IconNames.dislike_inactive_icon
		let like_icon = isLikeActive ? IconNames.like_active_icon : IconNames.like_inactive_icon

		if(!showOnlyMax){
			const accessibilityLabel = isDislikeActive ? translation_reset_rating : translation_set_rate_as_not_favorite
			const borderRightRadius = 0

			renderedOptions.push(
				<MyButton
					borderRightRadius={borderRightRadius}
					borderRadius={borderRadius} isActive={isDislikeActive} onPress={() => {
					if (isDislikeActive) {
						setRating(null)
					} else {
						setRating(MIN_RATING)
					}
				}} accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={dislike_icon} />
			)
		}

		const accessibilityLabel = isLikeActive ? translation_reset_rating : translation_set_rate_as_favorite
		let borderLeftRadius = undefined
		if(!showOnlyMax){ // only the first one should have a border radius on the left
			borderLeftRadius = 0
		}

		renderedOptions.push(
			<MyButton
				borderLeftRadius={borderLeftRadius}
				borderRadius={borderRadius} isActive={isLikeActive} onPress={() => {
				if (isLikeActive) {
					setRating(null)
				} else {
					setRating(MAX_RATING)
				}
			}} accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={like_icon} />
		)
	}
	if(foods_ratings_type === RatingType.stars){
		for(let i = MIN_RATING; i <= MAX_RATING; i++){
			let skipRating = showOnlyMax && i !== MAX_RATING

			if(!skipRating){
				let isRatingEqualOrHigher = false
				let isRatingEqual = false
				if(rating !== null && rating !== undefined){
					isRatingEqualOrHigher = i <= rating
					isRatingEqual = i === rating
				}

				let accessibilityLabel = translation_set_rating_to + ' ' + i;
				if(isRatingEqual){
					accessibilityLabel = translation_reset_rating;
				}
				if(showOnlyMax && i === MAX_RATING){
					accessibilityLabel = translation_set_rate_as_favorite
					if(isRatingEqual){
						accessibilityLabel = translation_reset_rating;
					}
				}

				let isTheLastOne = i === MAX_RATING
				let borderRightRadius = undefined
				if(!isTheLastOne){ // only the last one should have a border radius on the right
					borderRightRadius = 0
				}

				let isTheFirstOne = i === MIN_RATING
				let borderLeftRadius = undefined
				if(!isTheFirstOne && !showOnlyMax){ // only the first one should have a border radius on the left
					borderLeftRadius = 0
				}

				let icon = isRatingEqualOrHigher ? IconNames.star_active_icon : IconNames.star_inactive_icon
				renderedOptions.push(
					<MyButton
						borderLeftRadius={borderLeftRadius}
						borderRightRadius={borderRightRadius}
						borderRadius={borderRadius} isActive={isRatingEqualOrHigher} onPress={() => {
						if(isRatingEqual){
							setRating(null)
						} else {
							setRating(i)
						}
					}} accessibilityLabel={accessibilityLabel} tooltip={accessibilityLabel} icon={icon} />
				)
			}
		}
	}

	return (
		<View style={{
			width: "100%",
			flexDirection: "row",
		}}>
			{renderedOptions}
		</View>
	)
}