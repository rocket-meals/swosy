import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import SettingsList from '@/components/SettingsList';
import MyImage from '@/components/MyImage';
import { getImageUrl } from '@/constants/HelperFunctions';
import { fetchFoodDetailsById } from '@/redux/actions/FoodOffers/FoodOffers';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { RatingHelper, DatabaseTypes } from 'repo-depkit-common';
import styles from '../styles';

const FoodWishlist = () => {
	useSetPageTitle(TranslationKeys.food_wishlist);
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { language, primaryColor } = useAppSelector((state) => state.settings);
	const { ownFoodFeedbacks } = useAppSelector((state) => state.food);

	const [foods, setFoods] = useState<DatabaseTypes.Foods[]>([]);

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
			setFoods(results.filter(Boolean) as DatabaseTypes.Foods[]);
		});
	}, [fiveStarFeedbacks]);

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
							groupPosition={groupPosition}
							showSeparator={groupPosition !== 'bottom' && groupPosition !== 'single'}
						/>
					);
				})}
			</View>
		</ScrollView>
	);
};

export default FoodWishlist;
