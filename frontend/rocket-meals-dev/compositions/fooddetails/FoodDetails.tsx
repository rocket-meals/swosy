import {Foodoffers, Foods, FoodsFeedbacks, FoodsFeedbacksLabels} from '@/helper/database/databaseTypes/types';
import {Heading, MySpinner, Text, TextInput, useTextContrastColor, View} from '@/components/Themed';
import React, {useEffect, useState} from 'react';
import {loadFoodOffer} from '@/states/SynchedFoodOfferStates';
import {MyButton} from '@/components/buttons/MyButton';
import {IconNames} from '@/constants/IconNames';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {Dimensions} from 'react-native';
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
import {useSynchedFoodsFeedbacksLabelsDict} from "@/states/SynchedFoodsFeedbacksLabels";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {useProjectColor} from "@/states/ProjectInfo";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {AccountRequiredTouchableOpacity} from "@/components/buttons/AccountRequiredTouchableOpacity";
import {BUTTON_DEFAULT_BorderRadius, BUTTON_DEFAULT_Padding} from "@/components/buttons/MyButtonCustom";
import {
	getDictFoodFeedbackLabelsIdToAmount,
	getFoodFeedbackLabelsIdsFromFeedbacksWithLabels,
	loadFoodsFeedbacksForFoodWithFeedbackLabelsIds
} from "@/states/SynchedFoods";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {getMyModalActionSheetItemDefaultRightIcon, MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useSynchedOwnFoodFeedback} from "@/states/SynchedFoodFeedbacks";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {DateHelper} from "@/helper/date/DateHelper";
import {ReturnKeyType} from "@/helper/input/ReturnKeyType";

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

const FoodFeedbackSettingsRow = ({food_id, feedback_label_id, translation}: {food_id: string, feedback_label_id: string, translation: string}) => {
	const [foodFeedback, setOwnRating, setOwnComment, setOwnNotify, setOwnLabels] = useSynchedOwnFoodFeedback(food_id);

	let usedFoodFeedbacksForOwnLabels: FoodsFeedbacks[] = foodFeedback ? [foodFeedback] : []
	let ownFoodFeedbackLabelIds = getFoodFeedbackLabelsIdsFromFeedbacksWithLabels(usedFoodFeedbacksForOwnLabels)
	let active = ownFoodFeedbackLabelIds?.includes(feedback_label_id) ?? false

	let iconRight = getMyModalActionSheetItemDefaultRightIcon(active);

	// this is being rendered multiple times because the reference of foodFeedback is changing, therefore print the reference
	// only rerender if active or translation changes


	return <SettingsRow labelLeft={translation} accessibilityLabel={translation} rightIcon={iconRight} onPress={() => {
		if(!!ownFoodFeedbackLabelIds){
			let newSelectedLabels = [...ownFoodFeedbackLabelIds];
			if(newSelectedLabels.includes(feedback_label_id)){
				newSelectedLabels = newSelectedLabels.filter((value) => value !== feedback_label_id)
			} else {
				newSelectedLabels.push(feedback_label_id)
			}
			setOwnLabels(newSelectedLabels)
		}
	}} active={active}  />
}

export const useOnPressEditFoodFeedbackLabels = (food_id: string, onClose?: () => void) => {
	const translation_title = useTranslation(TranslationKeys.feedback_labels)
	const [modalConfig, setModalConfig] = useModalGlobalContext();
	const [foodFeedbackLabelsDict] = useSynchedFoodsFeedbacksLabelsDict();
	const [language, setLanguage] = useProfileLanguageCode()

	const feedbackLabelIdToTranslation: Record<string, string> = {}
	if(!!foodFeedbackLabelsDict){
		Object.keys(foodFeedbackLabelsDict).forEach((key) => {
			let label = foodFeedbackLabelsDict[key];
			let id = label.id;
			let labelTranslations = label.translations as TranslationEntry[];
			let translation = getDirectusTranslation(language, labelTranslations, 'text');
			if(translation){
				feedbackLabelIdToTranslation[id] = translation;
			}
		})
	}

	let items: MyModalActionSheetItem[] = []
	Object.keys(feedbackLabelIdToTranslation).forEach((key) => {
		let translation = feedbackLabelIdToTranslation[key];
		items.push({
			key: key,
			label: translation,
			accessibilityLabel: translation,
			title: translation,
			renderAsItem: (key: string, hide: () => void) => {
				// each component needs to have its own state
				let translation = feedbackLabelIdToTranslation[key];
				return <FoodFeedbackSettingsRow food_id={food_id} feedback_label_id={key} translation={translation}/>
		}
		})
	});


	return () => {
		let config: MyModalActionSheetItem = {
			title: translation_title,
			key: translation_title,
			accessibilityLabel: translation_title,
			label: translation_title,
			items: items,
			onCancel: () => {
				if(onClose){
					onClose()
				}
			}
		}

		setModalConfig(config)
	}
}

export const FoodFeedbacksLabelsComponent = ({food, remoteFoodFeedbacks, refresh}: {food: Foods, remoteFoodFeedbacks: FoodsFeedbacks[] | null | undefined, refresh: () => void}) => {
	const foods_feedbacks_labels_type = useFeedbackLabelsType()
	const [foodFeedbackLabelsDict] = useSynchedFoodsFeedbacksLabelsDict();
	const [language, setLanguage] = useProfileLanguageCode()


	const translation_feedback_labels = useTranslation(TranslationKeys.feedback_labels);

	const projectColor = useProjectColor();
	const projectContrastColor = useMyContrastColor(projectColor);
	const defaultTextColor = useTextContrastColor()

	const onPressEditFoodFeedbackLabels = useOnPressEditFoodFeedbackLabels(food.id, refresh)

	if(foods_feedbacks_labels_type === FeedbackLabelsType.disabled){
		return null
	}

	let renderedLabels: any[] = [];

	if(remoteFoodFeedbacks){
		let dictFoodFeedbackLabelsIdToAmount = getDictFoodFeedbackLabelsIdToAmount(remoteFoodFeedbacks);
		let labelKeys = Object.keys(dictFoodFeedbackLabelsIdToAmount ?? {});
		if(labelKeys.length>0){
			labelKeys.forEach((labelKey) => {
				const label: FoodsFeedbacksLabels | undefined = foodFeedbackLabelsDict?.[labelKey];
				let amount = dictFoodFeedbackLabelsIdToAmount[labelKey];
				let labelTranslations: TranslationEntry[] | undefined = label?.translations as TranslationEntry[];
				if(labelTranslations){
					let translation = getDirectusTranslation(language, labelTranslations, 'text');
					if(translation){
						let backgroundColor: string |undefined = undefined
						let borderColor = defaultTextColor;
						let textColor = defaultTextColor

						let amountText = '';
						if(amount>0){
							amountText = ' (' + amount + ')';
						}

						if(amount>0){
							renderedLabels.push(
								<View accessibilityLabel={translation} key={labelKey} style={{
									paddingBottom: 5,
									paddingHorizontal: 2
								}}>
									<View style={{
										backgroundColor: backgroundColor,
										borderColor: borderColor,
										borderWidth: 1,
										borderRadius: BUTTON_DEFAULT_BorderRadius,
										paddingHorizontal: BUTTON_DEFAULT_Padding
									}}>
										<Text style={{
											color: textColor,
										}}>{translation}{amountText}</Text>
									</View>
								</View>
							);
						}
					}
				}
			});
		} else {
			renderedLabels.push(
				<Text>{"TODO: TRANSLATE: No Food Feedbacks with Labels found"}</Text>
			)
		}
	} else if(remoteFoodFeedbacks===undefined){
		renderedLabels.push(
			<MySpinner />
		)
	} else {
		renderedLabels.push(
			<Text>{"TODO: TRANSLATE: No Food Feedbacks found"}</Text>
		)
	}



	return(
		<View style={{width: "100%", paddingTop: 10}}>
			<Heading>{translation_feedback_labels}</Heading>
			<View style={{width: "100%", height: 10}} />
			<View style={{width: "100%", flexDirection: "row", flexWrap: "wrap"}}>
				{renderedLabels}
			</View>
			<View style={{
				paddingBottom: 5,
				paddingHorizontal: 2
			}}>
			</View>
			<AccountRequiredTouchableOpacity>
				<MyButton accessibilityLabel={"TODO: Translation: Edit labels"} tooltip={"Edit labels"} text={"Edit labels"} rightIcon={IconNames.edit_icon} onPress={onPressEditFoodFeedbackLabels}/>
			</AccountRequiredTouchableOpacity>
		</View>
	)
}

export const FoodFeedbackCommentSingle = ({foodFeedback}: {foodFeedback: FoodsFeedbacks}) => {
	let comment = foodFeedback.comment+"";
	let date_updated = foodFeedback.date_updated
	let date_human_readable: string | undefined = undefined;
	if(date_updated){
		date_human_readable = DateHelper.formatOfferDateToReadable(new Date(date_updated), true, true);
	}

	return (
		<SettingsRow labelLeft={comment} accessibilityLabel={comment} labelRight={date_human_readable} />
	)
}

export const FoodFeedbackCommentDetails = ({food, remoteFoodFeedbacks}: {food: Foods, remoteFoodFeedbacks: FoodsFeedbacks[] | null | undefined;}) => {
	const usedFoodId = food.id;
	const [ownFoodFeedback, setOwnRating, setOwnComment, setOwnNotify, setOwnLabels] = useSynchedOwnFoodFeedback(food.id);

	const [language, setLanguage] = useProfileLanguageCode()

	const translation_to_the_forum = useTranslation(TranslationKeys.to_the_forum);
	const translation_your_comment = useTranslation(TranslationKeys.your_comment);
	const translation_comments = useTranslation(TranslationKeys.comments);
	const translation_save_comment = useTranslation(TranslationKeys.save_comment);

	// get app_settings
	const [appSettings] = useSynchedAppSettings();

	const foods_feedbacks_comments_type = useFeedbackCommentType()
	const foods_feedbacks_custom_url = appSettings?.foods_feedbacks_custom_url;

	if(foods_feedbacks_comments_type === FeedbackCommentType.disabled){
		return null
	}

	const [comment, setStateComment] = useState<string | null>(ownFoodFeedback?.comment ?? null);
	const onChangeText = (text: string) => {
		if (text === '') {
			setStateComment(null);
			return;
		}

		setStateComment(text);
	}

	const onSubmit = () => {
		setOwnComment(comment);
	}

	let commentContent = undefined;

	let saved_comment = ownFoodFeedback?.comment ?? null;

	let renderedComments: any[] = [];

	if(!!foods_feedbacks_custom_url){
		commentContent = <MyButton openHrefInNewTab={true} href={foods_feedbacks_custom_url} accessibilityLabel={translation_to_the_forum} tooltip={translation_to_the_forum} text={translation_to_the_forum} leftIcon={IconNames.comment_icon} rightIcon={IconNames.open_link_icon} />
	} else {


		commentContent = (
			<View style={{ width: "100%", paddingBottom: 20}}>
				<AccountRequiredTouchableOpacity>
					<TextInput placeholder={translation_your_comment} value={comment ?? ''} returnKeyType={ReturnKeyType.send} onChangeText={onChangeText} onSubmitEditing={() => {
						onSubmit();
					}} />

					<MyButton disabled={saved_comment === comment} isActive={saved_comment !== comment}
							  borderTopRadius={0}
							  accessibilityLabel={translation_save_comment}
							  text={translation_save_comment}
							  leftIcon={IconNames.comment_send_icon}
							  onPress={() => {
								  onSubmit();
							  }}
					/>
				</AccountRequiredTouchableOpacity>
			</View>
		)
	}

	if(saved_comment && ownFoodFeedback){
		renderedComments.push(
			<View style={{width: "100%", paddingTop: 10}}>
				<Heading>{translation_your_comment}</Heading>
			</View>
		)

		renderedComments.push(
			<FoodFeedbackCommentSingle foodFeedback={ownFoodFeedback} />
		)

	}

	if(foods_feedbacks_comments_type === FeedbackCommentType.read || foods_feedbacks_comments_type === FeedbackCommentType.readAndWrite){
		type DataItem = { key: string; data: FoodsFeedbacks; date_updated:  string | null | undefined}
		const data: DataItem[] = []
		if (remoteFoodFeedbacks) {
			for (let i=0; i<remoteFoodFeedbacks.length; i++) {
				const remoteFeedback = remoteFoodFeedbacks[i];
				if(remoteFeedback.id !== ownFoodFeedback?.id){
					if(remoteFeedback.comment){
						data.push({key: remoteFeedback.id, data: remoteFeedback, date_updated: remoteFeedback.date_updated})
					}
				}
			}
		}

		// sort by date_updated
		data.sort((a, b) => {
			let date_a_as_iso_string = a.date_updated;
			let date_b_as_iso_string = b.date_updated;
			if(date_a_as_iso_string && date_b_as_iso_string){
				let date_a = new Date(date_a_as_iso_string);
				let date_b = new Date(date_b_as_iso_string);
				return date_b.getTime() - date_a.getTime();
			} else {
				return 0;
			}
		});

		renderedComments.push(
			<MyGridFlatList data={data} renderItem={(item) => {
				let feedback: FoodsFeedbacks = item.item.data;
				return <FoodFeedbackCommentSingle foodFeedback={feedback} />
			}} />
		)
	}

	return (
		<View style={{width: "100%", paddingTop: 10}}>
			<Heading>{translation_comments}</Heading>
			<View style={{width: "100%", height: 10}} />
			{commentContent}
			{renderedComments}
		</View>
	)

}

export const FoodFeedbackRatingDetails = ({food}: {food: Foods}) => {
	const [appSettings] = useSynchedAppSettings();
	const foods_ratings_amount_display = appSettings?.foods_ratings_amount_display;
	const foods_ratings_average_display = appSettings?.foods_ratings_average_display;

	const translation_average_rating = useTranslation(TranslationKeys.average_rating);


	let ratingAmount = food.rating_amount;
	let ratingAverage = food.rating_average;

	let details = [];

	if(foods_ratings_amount_display){
		let borderRadiusRight = foods_ratings_average_display ? 0 : undefined

		details.push(
			<MyButton useOnlyNecessarySpace={true} accessibilityLabel={"TODO: Translation: Number of ratings"} tooltip={"Number of ratings"} borderRightRadius={borderRadiusRight} text={ratingAmount+""} leftIcon={IconNames.amount_rating_icon} />
		)
	}

	if(foods_ratings_average_display){
		let borderRadiusLeft = foods_ratings_amount_display ? 0 : undefined

		details.push(
			<MyButton useOnlyNecessarySpace={true} accessibilityLabel={translation_average_rating} tooltip={translation_average_rating} text={ratingAverage+""} borderLeftRadius={borderRadiusLeft} leftIcon={IconNames.average_icon} />
		)
	}

	return <View style={{
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	}}>
		<View>
			<FoodFeedbackRating food={food} showQuickAction={false}/>
		</View>
		<View style={{
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		}}>
			{details}
		</View>
	</View>
}

export const FoodFeedbackDetails = ({food}: {food: Foods}) => {
	// get app_settings

	const [remoteFoodFeedbacks, setRemoteFoodFeedbacks] = useState<FoodsFeedbacks[] | null | undefined>(undefined);
	const isDemo = useIsDemo();

	async function loadRemoteFoodsFeedbacksForFood(foodId: string): Promise<FoodsFeedbacks[]> {
		let result = loadFoodsFeedbacksForFoodWithFeedbackLabelsIds(food.id, isDemo);
		return result;
	}

	async function loadData() {
		// load the labels from the server for the food
		loadRemoteFoodsFeedbacksForFood(food.id)
			.then(setRemoteFoodFeedbacks)
			.catch(console.error);
	}

	async function refresh() {
		// load the labels from the server for the food
		loadData();
	}
	

	useEffect(() => {
		// load the labels from the server for the food
		loadData();
	}, [food.id]);

	return (
		<View style={{
			width: "100%",
		}}>
			<View style={{
				width: "100%",
				flexDirection: "row",
			}}>
				<FoodFeedbackRatingDetails food={food}/>
			</View>
			<FoodFeedbacksLabelsComponent food={food} remoteFoodFeedbacks={remoteFoodFeedbacks} refresh={refresh}/>
			<FoodFeedbackCommentDetails food={food} remoteFoodFeedbacks={remoteFoodFeedbacks}/>
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

	// get device height
	const screenHeight = Dimensions.get('window').height;
	const detailsMinHeight = screenHeight

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
										  content: <View style={{
											  width: "100%",
											  minHeight: detailsMinHeight // in order to prevent on small devices the jump up when the content is not large enough
										  }}><FoodNutritionDetails foodOfferData={foodOfferData}/></View>
									  },
									  {
										  iconName: IconNames.eating_habit_icon,
										  accessibilityLabel: translations_markings,
										  text: translations_markings,
										  content: <View style={{
											  width: "100%",
											  minHeight: detailsMinHeight // in order to prevent on small devices the jump up when the content is not large enough
										  }}><FoodMarkingDetails foodOfferData={foodOfferData}/></View>
									  },
									  {
										  iconName: IconNames.comment_icon,
										  accessibilityLabel: translations_food_feedbacks,
										  text: translations_food_feedbacks,
										  content: <View style={{
											  width: "100%",
											  minHeight: detailsMinHeight // in order to prevent on small devices the jump up when the content is not large enough
										  }}><FoodFeedbackDetails food={food} /></View>
									  },
								  ]
							  }
			/>
	)
}