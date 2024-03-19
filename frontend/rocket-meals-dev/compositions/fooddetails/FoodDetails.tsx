import {Foodoffers, Foods} from '@/helper/database/databaseTypes/types';
import {Text, TextInput, View} from '@/components/Themed';
import React, {useEffect, useState} from 'react';
import {loadFoodOffer} from '@/states/SynchedFoodOfferStates';
import {MyButton} from '@/components/buttons/MyButton';
import {IconNames} from '@/constants/IconNames';
import {useSynchedProfileFoodFeedback} from '@/states/SynchedProfile';
import {KeyboardAvoidingView, Platform} from 'react-native';
import NutritionList from '@/components/food/NutritionList';
import {useBreakPointValue} from '@/helper/device/DeviceHelper';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MarkingListSelective} from '@/components/food/MarkingList';
import {useIsDemo} from "@/states/SynchedDemo";
import {useIsDebug} from "@/states/Debug";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {FoodFeedbackRating} from "@/components/foodfeedback/FoodRatingDisplay";
import {useServerInfo} from "@/states/SyncStateServerInfo";
import {DetailsComponent} from "@/components/detailsComponent/DetailsComponent";
import {FoodNotifyButton} from "@/components/foodfeedback/FoodNotifyButton";

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
		<View style={{
			width: "100%",
		}}>
			<View style={{
				width: "100%",
				flexDirection: "row",
			}}>
				<FoodFeedbackRating food={food} showQuickAction={false}/>
			</View>
			<View style={{width: "100%", height: 10}} />
			{commentContent}
		</View>
	)
}

const FoodMarkingDetails = ({foodOfferData}: {foodOfferData: Foodoffers}) => {
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
			<MarkingListSelective markingIds={markingIds}/>
			<Text italic={true}>{translation_markings_disclaimer}</Text>
			{debugMarkings}
		</>
	)
}

const FoodNutritionDetails = ({foodOfferData}: {foodOfferData: Foodoffers}) => {
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
	const server = useServerInfo();

	useEffect(() => {
		loadFoodOffer(isDemo, foodOfferId)
			.then(setFoodOfferData)
			.catch(console.error);
	}, [foodOfferId]);

	const food = foodOfferData?.food;

	//TODO: This is a temporary "fix" for the SWOSY project
	if (server?.info?.project.project_name === "SWOSY" && food) {
		//replace the url with the server url
		// @ts-ignore
		food.image_remote_url = "https://swosy.sw-os.de:3001/api/meals/"+ food.id + "/photos";
	}


	if(foodOfferData && food && typeof food === 'object'){
		return <FoodDetailsWithFoodOfferAndFood foodOfferData={foodOfferData} food={food}/>
	}
}

function FoodDetailsWithFoodOfferAndFood({ foodOfferData, food }: { foodOfferData: Foodoffers, food: Foods }) {
	const translations_nutrition = useTranslation(TranslationKeys.nutrition);
	const translations_markings = useTranslation(TranslationKeys.markings);
	const translations_food_feedbacks = useTranslation(TranslationKeys.food_feedbacks);

	const quickActions = <View style={{flexDirection: 'row', justifyContent: 'space-between', flexWrap: "wrap"}}>
		<View style={{ flex: 1, flexDirection: "row" }}>
			<FoodFeedbackRating food={food} showQuickAction={false}/>
		</View>
		<View>
			<FoodNotifyButton food={food}/>
		</View>
	</View>

	return(
		<DetailsComponent item={food} heading={
			food.alias
		}
						  subHeadingComponent={quickActions}
						  image={{
							  assetId: food.image,
							  image_url: food.image_remote_url,
						  }}
						  tabs={
							  [
								  {
									  iconName: IconNames.nutrition_icon,
									  accessibilityLabel: translations_nutrition,
									  text: translations_nutrition,
									  content: <FoodNutritionDetails foodOfferData={foodOfferData}/>
								  },
								  {
									  iconName: IconNames.eating_habit_icon,
									  accessibilityLabel: translations_markings,
									  text: translations_markings,
									  content: <FoodMarkingDetails foodOfferData={foodOfferData}/>
								  },
								  {
									  iconName: IconNames.comment_icon,
									  accessibilityLabel: translations_food_feedbacks,
									  text: translations_food_feedbacks,
									  content: <FoodFeedbackDetails food={food} />
								  },
							  ]
						  }
		/>
	)
}