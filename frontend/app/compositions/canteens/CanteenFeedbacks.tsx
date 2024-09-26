import {Canteens, CanteensFeedbacksLabels} from '@/helper/database/databaseTypes/types';
import {Heading, Text, View} from '@/components/Themed';
import React from 'react';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useIsDebug} from "@/states/Debug";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {
	useSynchedCanteensFeedbacksLabelsDict,
	useSynchedCanteensFeedbacksLabelsListSortedAndFilteredByVisible
} from "@/states/SynchedCanteensFeedbacksLabels";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {AccountRequiredTouchableOpacity} from "@/components/buttons/AccountRequiredTouchableOpacity";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {SettingsRowTriStateLikeDislike} from "@/components/settings/SettingsRowTriStateLikeDislike";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";
import {FoodFeedbacksLabelsCountsType} from "@/states/SynchedFoodsFeedbacksLabelsEntries";
import {
	useLoadCanteensFeedbacksLabelsCountsForCanteen,
	useSynchedOwnCanteenFeedbackLabelEntry
} from "@/states/SynchedCanteensFeedbacksLabelsEntries";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";

type CanteenFeedbackSettingsRowDataProps = {canteen: Canteens, dateAsIsoString: string, label: CanteensFeedbacksLabels, translation: string, canteen_id?: string, foodoffer_id?: string}
type CanteenFeedbackSettingsRowProps = CanteenFeedbackSettingsRowDataProps
const CanteenFeedbackSettingsRow = ({canteen, dateAsIsoString, label, translation}: CanteenFeedbackSettingsRowProps) => {
	const [ownFeedbackLabelEntry, setDislike] = useSynchedOwnCanteenFeedbackLabelEntry(canteen, dateAsIsoString, label);
	const [reloadState, setReloadState] = React.useState(0);
	const labelCounts = useLoadCanteensFeedbacksLabelsCountsForCanteen(canteen.id, label, dateAsIsoString, reloadState+"");

	const [foodFeedbackLabelsDict] = useSynchedCanteensFeedbacksLabelsDict();
	const feedback_label_id = label.id;
	const foodFeedbackLabel = foodFeedbackLabelsDict?.[feedback_label_id];

	const foodsAreaColor = useFoodsAreaColor()

	const translationSetRating = useTranslation(TranslationKeys.set_rating);

	let dislikeRaw: boolean | undefined | null = ownFeedbackLabelEntry?.dislike
	let statusSet = dislikeRaw === true || dislikeRaw === false;
	const likes = statusSet ? !dislikeRaw : undefined;

	let iconLeftCustom = <DirectusImageOrIconComponent resource={foodFeedbackLabel} />

	return <SettingsRowTriStateLikeDislike
			color={foodsAreaColor}
			iconLeftCustom={iconLeftCustom}
			renderRightContentWrapper={(rightContent) => {
				return <AccountRequiredTouchableOpacity translationOfDesiredAction={translationSetRating}>
					{rightContent}
				</AccountRequiredTouchableOpacity>
			}}
			onSetState={async (nextLike: boolean | undefined) => {
				console.log("nextLike", nextLike)
				if(nextLike === undefined){
					await setDislike(null)
				} else {
					await setDislike(!nextLike)
				}
				setReloadState(reloadState+1)
			}} value={likes} labelLeft={translation} accessibilityLabel={translation} amount_likes={labelCounts.amount_likes} amount_dislikes={labelCounts.amount_dislikes} />
}


export const CanteenFeedbacksLabelsComponent = ({canteen, dateAsIsoString}: {canteen: Canteens | null | undefined, dateAsIsoString: string}) => {
	const canteensFeedbacksLabelsListSortedAndFilteredByVisible = useSynchedCanteensFeedbacksLabelsListSortedAndFilteredByVisible()
	const [language, setLanguage] = useProfileLanguageCode()
	const isDebug = useIsDebug()
	const translation_feedback_labels = useTranslation(TranslationKeys.feedback_labels);

	if(!canteen){
		return null
	}

	const feedbackLabelIdToTranslation: Record<string, string> = {}
	if(!!canteensFeedbacksLabelsListSortedAndFilteredByVisible){
		for(let label of canteensFeedbacksLabelsListSortedAndFilteredByVisible){
			if(!!label){
				let id = label.id;
				let labelTranslations = label.translations as TranslationEntry[];
				let translation = getDirectusTranslation(language, labelTranslations, 'text');
				if(translation){
					feedbackLabelIdToTranslation[id] = translation;
				}
			}
		}
	}

	type DataItem = { key: string; data: CanteenFeedbackSettingsRowDataProps}
	const data: DataItem[] = []

	for(let label of canteensFeedbacksLabelsListSortedAndFilteredByVisible){
		let key = label?.id;
		let translation = feedbackLabelIdToTranslation[key];

		data.push({key: key,
			data: {
				canteen: canteen,
				label: label,
				dateAsIsoString: dateAsIsoString,
				translation: translation,
			}
		})
	}

	let listOfFeedbackLabels = <MyGridFlatList data={data} renderItem={(listitem) => {
		let item: CanteenFeedbackSettingsRowDataProps = listitem.item.data;
		return <CanteenFeedbackSettingsRow {...item} />
	}} amountColumns={1} />

	let debugContent = null;
	if (isDebug) {
		debugContent = <View>
			<Text>{"canteensFeedbacksLabelsListSortedAndFilteredByVisible"}</Text>
			<Text>{JSON.stringify(canteensFeedbacksLabelsListSortedAndFilteredByVisible, null, 2)}</Text>
		</View>
	}

	if(data.length === 0){
		return null
	}

	return(
		<View style={{width: "100%", paddingTop: 20}}>
			<View style={{
				width: "100%",
				paddingLeft: SETTINGS_ROW_DEFAULT_PADDING,
			}}>
				<Heading>{translation_feedback_labels}</Heading>
			</View>
			<View style={{width: "100%", flexDirection: "row", flexWrap: "wrap"}}>
				{debugContent}
				{listOfFeedbackLabels}
			</View>
		</View>
	)
}