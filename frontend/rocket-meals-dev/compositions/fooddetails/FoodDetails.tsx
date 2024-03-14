import {Foodoffers, Foods} from '@/helper/database/databaseTypes/types';
import {Heading, Text, TextInput, View} from '@/components/Themed';

import {Rectangle} from '@/components/shapes/Rectangle';
import React, {useEffect, useState} from 'react';
import {loadFoodOffer} from '@/states/SynchedFoodOfferStates';
import {MyButton} from '@/components/buttons/MyButton';
import TabWrapper from '@/components/tab/TabWrapper';
import {IconNames} from '@/constants/IconNames';
import {useSynchedProfileFoodFeedback} from '@/states/SynchedProfile';
import {DimensionValue, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import ImageWithComponents from '@/components/project/ImageWithComponents';
import IndividualPricingBadge from '@/components/pricing/IndividualPricingBadge';
import NutritionList from '@/components/food/NutritionList';
import {useBreakPointValue} from '@/helper/device/DeviceHelper';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MarkingListSelective} from '@/components/food/MarkingList';
import {useIsDemo} from "@/states/SynchedDemo";
import {useIsDebug} from "@/states/Debug";
import {FoodNotifyButton} from "@/components/foodfeedback/FoodNotifyButton";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {FoodFeedbackRating} from "@/components/foodfeedback/FoodRatingDisplay";

export enum FeedbackCommentType {
	disabled='disabled',
	write='write',
	read='read',
	readAndWrite='readAndWrite'
}


export const useFeedbackCommentType = (): FeedbackCommentType => {
	const [appSettings] = useSynchedAppSettings();
	const commentType = appSettings?.foods_feedbacks_comments_type;
	let feedbackCommentType: FeedbackCommentType = FeedbackCommentType.disabled
	if(commentType === 'write'){
		feedbackCommentType = FeedbackCommentType.write
	} else if(commentType === 'read'){
		feedbackCommentType = FeedbackCommentType.read
	} else if(commentType === 'readAndWrite'){
		feedbackCommentType = FeedbackCommentType.readAndWrite
	}
	return feedbackCommentType
}

export enum FeedbackLabelsType {
	disabled='disabled',
	use='use',
	useAndRead='useAndRead'
}

export const useFeedbackLabelsType = (): FeedbackLabelsType => {
	const [appSettings] = useSynchedAppSettings();
	const labelsType = appSettings?.foods_feedbacks_labels_type;
	let feedbackLabelsType: FeedbackLabelsType = FeedbackLabelsType.disabled
	if(labelsType === 'use'){
		feedbackLabelsType = FeedbackLabelsType.use
	} else if(labelsType === 'useAndRead'){
		feedbackLabelsType = FeedbackLabelsType.useAndRead
	}
	return feedbackLabelsType
}


export const FoodFeedbackDetails = ({food}: {food: Foods}) => {
	const usedFoodId = food.id;
	const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(usedFoodId);

	const translation_to_the_forum = useTranslation(TranslationKeys.to_the_forum);

	// get app_settings
	const [appSettings] = useSynchedAppSettings();

	const foods_feedbacks_comments_type = useFeedbackCommentType()
	const foods_feedbacks_custom_url = appSettings?.foods_feedbacks_custom_url;

	const foods_feedbacks_labels_type = appSettings?.foods_feedbacks_labels_type;
	const foods_ratings_amount_display = appSettings?.foods_ratings_amount_display;
	const foods_ratings_average_display = appSettings?.foods_ratings_average_display;


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

	let commentContent = undefined;

	if(!!foods_feedbacks_custom_url){
		commentContent = <MyButton openHrefInNewTab={true} href={foods_feedbacks_custom_url} accessibilityLabel={translation_to_the_forum} tooltip={translation_to_the_forum} text={translation_to_the_forum} leftIcon={IconNames.comment_icon} rightIcon={IconNames.open_link_icon} />
	} else {
		commentContent = (
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

	return (
		<View>
			<FoodFeedbackRating food={food} showOnlyMax={false}/>
			{commentContent}
		</View>
	)
}

const FoodMarkingDetails = ({foodOfferData, title}: {foodOfferData: Foodoffers, title: string}) => {
	const isDebug = useIsDebug()

	const markingIds: string[] = [];
	let foodOfferMarkings = foodOfferData?.markings || [];
	foodOfferMarkings.forEach((marking) => {
		markingIds.push(marking.markings_id);
	});

	const translation_markings_disclaimer = useTranslation(TranslationKeys.markings_disclaimer)

	let debugMarkings = undefined
	if(isDebug){
		debugMarkings = <View>
			<Text>{JSON.stringify(foodOfferData?.markings, null, 2)}</Text>
		</View>
	}

	return(
		<>
			<Text size={'md'} style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
			<MarkingListSelective markingIds={markingIds}/>
			<Text italic={true}>{translation_markings_disclaimer}</Text>
			{debugMarkings}
		</>
	)
}

const FoodNutritionDetails = ({foodOfferData, title}: {foodOfferData: Foodoffers, title: string}) => {
	const nutritionColumns = useBreakPointValue<number>({
		sm: 2,
		md: 2,
		lg: 3,
		xl: 3,
	})

	const translation_disclaimer = useTranslation(TranslationKeys.nutrition_disclaimer);

	return(
		<>
			<View style={{ justifyContent: 'space-between' }}>
				<Text size={'md'} style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
				<View>
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
			</View>
			<View>
				<Text italic={true}>{translation_disclaimer}</Text>
			</View>
		</>
	)
}

export default function FoodDetails({ foodOfferId }: { foodOfferId: string }) {
	const [foodOfferData, setFoodOfferData] = useState<Foodoffers>();
	const isDemo = useIsDemo()

	useEffect(() => {
		loadFoodOffer(isDemo, foodOfferId)
			.then(setFoodOfferData)
			.catch(console.error);
	}, [foodOfferId]);

	const food = foodOfferData?.food;
	if(foodOfferData && food && typeof food === 'object'){
		return <FoodDetailsWithFoodOfferAndFood foodOfferData={foodOfferData} food={food}/>
	}
}

function FoodDetailsWithFoodOfferAndFood({ foodOfferData, food }: { foodOfferData: Foodoffers, food: Foods }) {
	const isDebug = useIsDebug()

	const translations_nutrition = useTranslation(TranslationKeys.nutrition);
	const translations_markings = useTranslation(TranslationKeys.markings);
	const translations_food_feedbacks = useTranslation(TranslationKeys.food_feedbacks);

	const imageWidthPercentage = useBreakPointValue<DimensionValue | undefined>({
		sm: '100%',
		md: '100%',
		lg: '60%',
		xl: '40%',
	})

	type flexDirectionTypes = 'row' | 'column' | 'row-reverse' | 'column-reverse' | undefined;
	const showAsRowOrColumn = useBreakPointValue<flexDirectionTypes>({
		sm: 'column',
		md: 'column',
		lg: 'row',
		xl: 'row',
	})

	function renderDebug() {
		if(isDebug){
			return(
				<View>
					<Text>{JSON.stringify(foodOfferData, null, 2)}</Text>
				</View>
			)
		}
	}



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
			{(
				<ScrollView>
					<View style={{width: '100%', flex: 1, flexDirection: showAsRowOrColumn}}>
						<View style={{width: imageWidthPercentage}}>
							<Rectangle>
								<ImageWithComponents
									image={{
										assetId: food.image,
										image_url: food.image_remote_url,
									}}
									innerPadding={0}
									bottomRightComponent={
										<IndividualPricingBadge foodOffer={foodOfferData}/>
									}
								/>
							</Rectangle>
						</View>

						<View style={{ flex: 1}}>
							<View style={{padding: 4, flexDirection: 'column', justifyContent: 'space-between'}}>
								<View>
									<Heading>
										{foodOfferData.alias}
									</Heading>
								</View>

								<View style={{flexDirection: 'row', justifyContent: 'space-between', flexWrap: "wrap"}}>
									<View style={{ flex: 1, flexDirection: "row" }}>
										<FoodFeedbackRating food={food} showOnlyMax={true}/>
									</View>
									<View>
										<FoodNotifyButton food={food}/>
									</View>
								</View>
							</View>

							<View style={{ marginTop: 10, marginHorizontal: 10, flex: 1 }}>
								<TabWrapper headers={[
									(active, setActive) => renderTapHeader(active, setActive, true, false, IconNames.nutrition_icon, translations_nutrition, translations_nutrition),
									(active, setActive) => renderTapHeader(active, setActive, false, false, IconNames.eating_habit_icon, translations_markings, translations_markings),
									(active, setActive) => renderTapHeader(active, setActive, false, true, IconNames.comment_icon, translations_food_feedbacks, translations_food_feedbacks),
								]}
								defaultActive={0}
								contents={[
									<View style={{ padding: 4, flex: 1 }}>
										<FoodNutritionDetails foodOfferData={foodOfferData} title={translations_nutrition}/>
									</View>,
									<View style={{ padding: 4 }}>
										<FoodMarkingDetails foodOfferData={foodOfferData} title={translations_markings}/>
									</View>,
									<View style={{ paddingTop: 4 }}>
										<View style={{ padding: 4 }}>
											<Text size={'md'} style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{translations_food_feedbacks}</Text>
										</View>
										<FoodFeedbackDetails food={food} />
									</View>
								]}
								/>
							</View>
							{renderDebug()}
						</View>
					</View>
				</ScrollView>
			)}
		</View>
	)
}