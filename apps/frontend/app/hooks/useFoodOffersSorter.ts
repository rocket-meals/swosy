import { useCallback, useMemo } from 'react';
import { DatabaseTypes, FoodSortOption } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import { sortFoodOffers } from '@/helper/foodOfferSortHelper';

const EMPTY_FEEDBACKS: any[] = [];

/**
 * The food offer ordering the user chose on the food offers screen (sort option, eating
 * habits, price group, own ratings). Used by the food offers list and wherever else the
 * app needs "the food that fits the user best", e.g. the lunch suggestion in the course
 * timetable.
 */
export default function useFoodOffersSorter() {
	const { sortBy, language } = useAppSelector(state => state.settings);
	const { ownFoodFeedbacks, foodCategories, foodOfferCategories } = useAppSelector(state => state.food);
	const profile = useAppSelector(state => state.authReducer.profile);

	// Own feedbacks only matter for these two options; passing an empty list otherwise keeps
	// the sort stable while the user rates foods.
	const ownFoodFeedbacksForSort = useMemo(() => {
		if (sortBy === FoodSortOption.FAVORITE || sortBy === FoodSortOption.INTELLIGENT) {
			return ownFoodFeedbacks;
		}
		return EMPTY_FEEDBACKS;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sortBy]);

	return useCallback(
		(foodOffers: DatabaseTypes.Foodoffers[]) =>
			sortFoodOffers(sortBy as FoodSortOption, foodOffers, {
				languageCode: language,
				ownFoodFeedbacks: ownFoodFeedbacksForSort,
				profile,
				foodCategories,
				foodOfferCategories,
				useFoodOfferCategoryOnly: true,
			}),
		[sortBy, language, ownFoodFeedbacksForSort, profile, foodCategories, foodOfferCategories]
	);
}
