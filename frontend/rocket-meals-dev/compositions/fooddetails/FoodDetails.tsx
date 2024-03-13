import {Foodoffers, Foods} from '@/helper/database/databaseTypes/types';
import {Heading, Text, TextInput, View} from '@/components/Themed';

import {Rectangle} from '@/components/shapes/Rectangle';
import React, {useEffect, useState} from 'react';
import {loadFoodOfferFromServer} from '@/states/SynchedFoodOfferStates';
import {MyButton} from '@/components/buttons/MyButton';
import TabWrapper from '@/components/tab/TabWrapper';
import {IconNames} from '@/constants/IconNames';
import {RatingType} from '@/components/rating/RatingValueIcon';
import {FoodRatingDisplay} from '@/components/rating/FoodRatingDisplay';
import {useSynchedProfileFoodFeedback} from '@/states/SynchedProfile';
import {KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import ImageWithComponents from '@/components/project/ImageWithComponents';
import IndividualPricingBadge from '@/components/pricing/IndividualPricingBadge';
import NutritionList from '@/components/food/NutritionList';
import {useBreakPointValue} from '@/helper/device/DeviceHelper';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import MarkingList from '@/components/food/MarkingList';

export const FoodFeedbackDetails = ({foodId}: {foodId:  string | Foods}) => {
	const usedFoodId = typeof foodId === 'string' ? foodId : foodId.id;
	const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(usedFoodId);

	const [comment, setStateComment] = useState<string | null>(foodFeedback?.comment ?? null);
	const onChangeText = (text: string) => {
		if (text === '') {
			setStateComment(null);
			return;
		}

		setStateComment(text);
	}

	const onSubmit = () => {
		setComment(comment);
	}

	return (
		<KeyboardAvoidingView enabled={true} keyboardVerticalOffset={150} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
			<View style={{ marginBottom: 100 }}>
				<TextInput placeholder={'Comment'} value={comment ?? ''} onChangeText={onChangeText} />

				<MyButton isActive={comment !== null || (foodFeedback?.comment ?? null) !== comment}
					borderTopRadius={0}
					accessibilityLabel={'Send feedback'}
					text={'Send feedback'}
					leftIcon={IconNames.comment_send_icon}
					onPress={() => {
						onSubmit();
					}}
				/>
			</View>
		</KeyboardAvoidingView>
	)
}

export default function FoodDetails({ foodOfferId }: { foodOfferId: string }) {
	const [foodOfferData, setFoodOfferData] = useState<Foodoffers>();
	useEffect(() => {
		loadFoodOfferFromServer(foodOfferId)
			.then(setFoodOfferData)
			.catch(console.error);
	}, [foodOfferId]);

	const foodId = foodOfferData?.food;

	const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(foodOfferData?.food.id);

	const translations_nutrition = useTranslation(TranslationKeys.nutrition);
	const translations_markings = useTranslation(TranslationKeys.markings);
	const translations_food_feedbacks = useTranslation(TranslationKeys.food_feedbacks);
	const translation_disclaimer = useTranslation(TranslationKeys.nutrition_disclaimer);
	const translation_markings_disclaimer = useTranslation(TranslationKeys.markings_disclaimer)

	const imageWidthPercentage = useBreakPointValue<string>({
		sm: '100%',
		md: '100%',
		lg: '60%',
		xl: '40%',
	})

	const showAsRowOrColumn = useBreakPointValue<string>({
		sm: 'column',
		md: 'column',
		lg: 'row',
		xl: 'row',
	})

	const nutritionColumns = useBreakPointValue<number>({
		sm: 2,
		md: 2,
		lg: 3,
		xl: 3,
	})

	function renderTapHeader(active: boolean, setActive: () => void, leftRoundedBorder: boolean, rightRoundedBorder: boolean ,iconName: string, accessibilityLabel: string, text: string) {
		const leftBorderRadius = leftRoundedBorder ? undefined : 0;
		const rightBorderRadius = rightRoundedBorder ? undefined : 0;

		return (
			<View style={{width: '100%'}}><MyButton icon={iconName}
				centerItems={true}
				text={text}
				tooltip={text}
				accessibilityLabel={accessibilityLabel}
				isActive={active}
				onPress={() => {
					setActive();
				}}
				borderLeftRadius={leftBorderRadius}
				borderRightRadius={rightBorderRadius}
			                              />
			</View>
		)
	}

	return (
		<View style={{ padding: 0, width: '100%', height: '100%' }}>
			{ foodOfferData && (
				<ScrollView>
					<View style={{width: '100%', display: 'flex', flexDirection: showAsRowOrColumn}}>
						<View style={{width: imageWidthPercentage, display: 'flex'}}>
							<Rectangle>
								<ImageWithComponents
									image={{
										assetId: foodOfferData.food.image,
										image_url: foodOfferData.food.image_remote_url,
									}}
									innerPadding={0}
									bottomRightComponent={
										<IndividualPricingBadge foodOffer={foodOfferData}/>
									}
								/>
							</Rectangle>
						</View>

						<View style={{ display: 'flex', flexGrow: 1 }}>
							<View style={{height: 100, padding: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
								<View>
									<Heading>
										{foodOfferData.alias}
									</Heading>
								</View>

								<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
									<View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '50%' }}>
										{/*<RatingValueIcon ratingType={RatingType.smilies} ratingValue={1} isActive={true}/>*/}
										<FoodRatingDisplay userRating={3} ratingType={RatingType.smilies} isActive={true}/>
									</View>
									<View>
										<MyButton useOnlyNecessarySpace={true}
											useTransparentBackgroundColor={true}
											useTransparentBorderColor={true}
											accessibilityLabel={foodFeedback?.notify ? 'Unnotify' : 'Notify'}
											icon={foodFeedback?.notify ? 'bell' : 'bell-off'}
											onPress={() => {
												setNotify(!foodFeedback?.notify);
											}}
										/>
									</View>
								</View>
							</View>

							<View style={{ display: 'flex', marginTop: 10, marginHorizontal: 10, flexGrow: 1 }}>
								<TabWrapper headers={[
									(active, setActive) => renderTapHeader(active, setActive, true, false, IconNames.nutrition_icon, translations_nutrition, translations_nutrition),
									(active, setActive) => renderTapHeader(active, setActive, false, false, IconNames.eating_habit_icon, translations_markings, translations_markings),
									(active, setActive) => renderTapHeader(active, setActive, false, true, IconNames.comment_icon, translations_food_feedbacks, translations_food_feedbacks),
								]}
								defaultActive={2}
								contents={[
									<View style={{ padding: 4, display: 'flex', flexGrow: 1 }}>
										<View style={{ justifyContent: 'space-between', display: 'flex', flexGrow: 1 }}>
											<Text size={'md'} style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{translations_nutrition}</Text>
											<NutritionList
												columnAmount={nutritionColumns}
												protein_g={foodOfferData.protein_g}
												fat_g={foodOfferData.fat_g}
												carbohydrate_g={foodOfferData.carbohydrate_g}
												fiber_g={foodOfferData.fiber_g}
												sugar_g={foodOfferData.sugar_g}
												sodium_g={foodOfferData.sodium_g}
												calories_kcal={foodOfferData.calories_kcal}
												saturated_fat_g={foodOfferData.saturated_fat_g}
											/>
										</View>
										<Text italic={true}>{translation_disclaimer}</Text>
									</View>,
									<View style={{ padding: 4 }}>
										<Text size={'md'} style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{translations_markings}</Text>
										<MarkingList markingIds={foodOfferData.markings.map((x) => x.markings_id)}/>
										<Text italic={true}>{translation_markings_disclaimer}</Text>
									</View>,
									<View style={{ paddingTop: 4 }}>
										<View style={{ padding: 4 }}>
											<Text size={'md'} style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{translations_food_feedbacks}</Text>
										</View>
										{ foodId &&
                                    <FoodFeedbackDetails foodId={foodId} />
										}
									</View>
								]}
								/>
							</View>
						</View>
					</View>
				</ScrollView>
			)}
		</View>
	)
}