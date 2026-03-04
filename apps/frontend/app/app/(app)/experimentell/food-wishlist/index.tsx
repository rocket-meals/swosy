import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Octicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import SettingsList from '@/components/SettingsList';
import MyImage from '@/components/MyImage';
import { getImageUrl } from '@/constants/HelperFunctions';
import { fetchFoodDetailsById, fetchLastFoodOfferByFoodAndCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { RatingHelper, DatabaseTypes } from 'repo-depkit-common';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import styles from '../styles';

const FoodWishlist = () => {
	useSetPageTitle(TranslationKeys.food_wishlist);
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { language, primaryColor } = useAppSelector((state) => state.settings);
	const { ownFoodFeedbacks } = useAppSelector((state) => state.food);
	const selectedCanteen = useSelectedCanteen();

	const [foods, setFoods] = useState<DatabaseTypes.Foods[]>([]);
	const [lastOfferedDates, setLastOfferedDates] = useState<Record<string, string | null>>({});

	const fiveStarFeedbacks = useMemo(
		() => (ownFoodFeedbacks as DatabaseTypes.FoodsFeedbacks[]).filter((feedback) => RatingHelper.isMaxRating(feedback.rating)),
		[ownFoodFeedbacks]
	);

	useEffect(() => {
		if (fiveStarFeedbacks.length === 0) {
			setFoods([]);
			return;
		}
		Promise.all(
			fiveStarFeedbacks.map((feedback: DatabaseTypes.FoodsFeedbacks) =>
				fetchFoodDetailsById(String(feedback.food)).catch(() => null)
			)
		).then((results) => {
			const foodItems = results
				.map((result: { data?: DatabaseTypes.Foods } | null) => result?.data ?? null)
				.filter(Boolean) as DatabaseTypes.Foods[];
			setFoods(foodItems);
		});
	}, [fiveStarFeedbacks]);

	useEffect(() => {
		if (foods.length === 0 || !selectedCanteen?.id) return;
		const canteenId = String(selectedCanteen.id);
		const dates: Record<string, string | null> = {};
		Promise.all(
			foods.map(async (food) => {
				const foodId = String(food.id);
				try {
					const offer = await fetchLastFoodOfferByFoodAndCanteen(foodId, canteenId);
					dates[foodId] = offer?.date ?? null;
				} catch {
					dates[foodId] = null;
				}
			})
		).then(() => setLastOfferedDates(dates));
	}, [foods, selectedCanteen?.id]);

	return (
		<ScrollView
			style={{ ...styles.container, backgroundColor: theme.screen.background }}
			contentContainerStyle={{
				...styles.contentContainer,
				backgroundColor: theme.screen.background,
			}}
		>
			<View style={{ ...styles.content }}>
				<Text style={{ ...styles.heading, color: theme.screen.text }}>
					{translate(TranslationKeys.food_wishlist)}
				</Text>
				{foods.map((food, index) => {
					const totalItems = foods.length;
					const groupPosition =
						totalItems === 1
							? 'single'
							: index === 0
							? 'top'
							: index === totalItems - 1
							? 'bottom'
							: 'middle';

					const imageUri =
						food.image_remote_url ||
						getImageUrl(food.image as string) ||
						undefined;

					const foodName =
						getTextFromTranslation(food.translations as DatabaseTypes.FoodsTranslations[], language || 'de') ||
						food.alias ||
						'';

					const foodId = String(food.id);
					const lastDate = lastOfferedDates[foodId];
					const lastOfferedLabel = lastDate
						? `${translate(TranslationKeys.last_offered_in_canteen)}: ${new Date(lastDate).toLocaleDateString()}`
						: undefined;

					return (
						<SettingsList
							key={food.id}
							iconBgColor={primaryColor}
							leftIconComponent={
								<MyImage
									remote_image_url={imageUri}
									directus_asset_id={!imageUri ? (food.image as string) : undefined}
									style={{
										width: 34,
										height: 34,
										borderRadius: 8,
										marginRight: 10,
									}}
									contentFit="cover"
								/>
							}
							label={foodName}
							value={lastOfferedLabel}
							groupPosition={groupPosition}
							showSeparator={groupPosition !== 'bottom' && groupPosition !== 'single'}
							rightIcon={<Octicons name="chevron-right" size={24} color={theme.screen.icon} />}
							onPress={() => {
								router.push({
									pathname: '/(app)/foodoffers/details',
									params: { foodId },
								});
							}}
						/>
					);
				})}
			</View>
		</ScrollView>
	);
};

export default FoodWishlist;
