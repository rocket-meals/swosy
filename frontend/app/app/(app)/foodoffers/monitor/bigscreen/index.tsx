import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowCanteenSelection} from "@/compositions/settings/SettingsRowProfileCanteen";
import {useIsDemo} from "@/states/SynchedDemo";
import {loadFoodCategoriesForNext7Days} from "@/states/SynchedFoodOfferStates";
import {SettingsRowOptionWithCustomInput} from "@/components/settings/SettingsRowOptionWithCustomInput";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {Text, View} from "@/components/Themed";
import {useIsDebug} from "@/states/Debug";
import {SettingsRowNumberEdit} from "@/components/settings/SettingsRowNumberEdit";
import {getRouteToFoodBigScreen} from "@/app/(app)/foodoffers/monitor/bigscreen/details";
import {ExpoRouter} from "expo-router/types/expo-router";
import {SettingsRowNavigateWithText} from "@/components/settings/SettingsRowNavigate";
import {SettingsRowBooleanSwitch} from "@/components/settings/SettingsRowBooleanSwitch";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {FoodOfferCategoriesHelper, useSynchedFoodoffersCategoriesDict} from "@/states/SynchedFoodoffersCategories";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {SettingsRowSyncBooleanSwitch} from "@/components/settings/SettingsRowSyncBooleanSwitch";
import {FoodsCategoriesHelper, useSynchedFoodsCategoriesDict} from "@/states/SynchedFoodsCategories";

export default function FoodBigScreenSettings() {

	const isDebug = useIsDebug()
	const isDemo = useIsDemo()

	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const [foodoffersCategoriesDict, setFoodoffersCategoriesDict] = useSynchedFoodoffersCategoriesDict()
	const foodoffersCategoriesList = CollectionHelper.convertDictToList(foodoffersCategoriesDict)

	const [foodCategoriesDict, setFoodCategoriesDict] = useSynchedFoodsCategoriesDict()
	const foodCategoriesList = CollectionHelper.convertDictToList(foodCategoriesDict)

	const [selectedCanteen, setSelectedCanteen] = React.useState<Canteens | null>(null);
	const canteenAlias = selectedCanteen?.alias || selectedCanteen?.id || undefined
	const canteenId = selectedCanteen?.id || undefined

	const [nextFoodIntervalInSeconds, setNextFoodIntervalInSeconds] = React.useState<number | null | undefined>(10);
	const [refreshFoodOffersIntervalInSeconds, setRefreshFoodOffersIntervalInSeconds] = React.useState<number | null | undefined>(5*60);

	const [fullScreen, setFullScreen] = React.useState<boolean>(true);


	const [selectedFoodofferCategoryIds, setSelectedFoodofferCategoryIds] = React.useState<string[]>([]);
	const [showFoodofferCategoryName, setShowFoodofferCategoryName] = React.useState<boolean>(true);

	const [selectedFoodCategoryIds, setSelectedFoodCategoryIds] = React.useState<string[]>([]);
	const [showFoodCategoryName, setShowFoodCategoryName] = React.useState<boolean>(false);


	let route: null | ExpoRouter.Href = null;
	if(canteenId){
		route = getRouteToFoodBigScreen(canteenId, selectedFoodofferCategoryIds, showFoodofferCategoryName, selectedFoodCategoryIds, showFoodCategoryName, nextFoodIntervalInSeconds, refreshFoodOffersIntervalInSeconds, fullScreen);
	}


	const renderFoodofferCategorySelection = (selectedFoodofferCategoryIds: string[]) => {
		// Auf den TVs wird ein TV
		// ·         Pasta&Friends,
		// ·         einer Fleisch und Meer,
		// ·         einer Veggie und Vegan,
		// ·         einer Queerbeet,
		// ·         einer Evergreens

		const options: MyModalActionSheetItem[] = [];
		for(const foodoffersCategory of foodoffersCategoriesList) {
			let categoryName = FoodOfferCategoriesHelper.getFoodofferCategoryName(foodoffersCategory, languageCode)
			let id = foodoffersCategory.id

			const isSelected = selectedFoodofferCategoryIds.includes(id)

			options.push({
				key: id,
				active: isSelected,
				label: categoryName,
				accessibilityLabel: categoryName,
				onSelect: (key: string, hide: () => void) => {
					setSelectedFoodofferCategoryIds([key]);
					hide();
				}
			})
		}

		const firstSelectedFoodofferCategory = selectedFoodofferCategoryIds[0]
		const firstSelectedFoodofferCategoryObject = foodoffersCategoriesDict?.[firstSelectedFoodofferCategory]
		const firstSelectedFoodofferCategoryName = FoodOfferCategoriesHelper.getFoodofferCategoryName(firstSelectedFoodofferCategoryObject, languageCode)

		return <>
			<SettingsRowOptionWithCustomInput key={JSON.stringify(foodoffersCategoriesList)+JSON.stringify(selectedFoodofferCategoryIds)} options={{
				onCustomInputSave: (value: string | undefined | null) => {
					if(value){
						setSelectedFoodofferCategoryIds([value])
					} else {
						setSelectedFoodofferCategoryIds([])
					}
				},
				currentValue: firstSelectedFoodofferCategoryName,
				title: "Speiseangebot Kategorie Wählen",
				items: options
			}} labelLeft="Speiseangebot Kategorie (optional)" accessibilityLabel={"Speiseangebot Kategorie"} />
		</>
	}

	const renderFoodCategorySelection = (selectedFoodCategoryIds: string[]) => {
		// Auf den TVs wird ein TV
		// ·         Pasta&Friends,
		// ·         einer Fleisch und Meer,
		// ·         einer Veggie und Vegan,
		// ·         einer Queerbeet,
		// ·         einer Evergreens

		const options: MyModalActionSheetItem[] = [];
		for(const foodCategory of foodCategoriesList) {
			let categoryName = FoodOfferCategoriesHelper.getFoodofferCategoryName(foodCategory, languageCode)
			let id = foodCategory.id

			const isSelected = selectedFoodCategoryIds.includes(id)

			options.push({
				key: id,
				active: isSelected,
				label: categoryName,
				accessibilityLabel: categoryName,
				onSelect: (key: string, hide: () => void) => {
					setSelectedFoodofferCategoryIds([key]);
					hide();
				}
			})
		}

		const firstSelectedFoodCategoryId = selectedFoodCategoryIds[0]
		const firstSelectedFoodCategoryObject = foodCategoriesDict?.[firstSelectedFoodCategoryId]
		const firstSelectedFoodCategoryName = FoodsCategoriesHelper.getFoodCategoryName(firstSelectedFoodCategoryObject, languageCode)

		return <>
			<SettingsRowOptionWithCustomInput key={JSON.stringify(foodCategoriesList)+selectedFoodCategoryIds} options={{
				onCustomInputSave: (value: string | undefined | null) => {
					if(value){
						setSelectedFoodofferCategoryIds([value])
					} else {
						setSelectedFoodofferCategoryIds([])
					}
				},
				currentValue: firstSelectedFoodCategoryName,
				title: "Speise Kategorie Wählen",
				items: options
			}} labelLeft="Speise Kategorie (optional)" accessibilityLabel={"Speise Kategorie"} />
		</>
	}

	function renderDebugInfo(){
		if(isDebug){
			return <>
				<SettingsRowGroup label={"foodCategories"}>
					<View>
						<Text>
							{JSON.stringify(foodoffersCategoriesList, null, 2)}
						</Text>
					</View>
				</SettingsRowGroup>
			</>
		}

	}

	function showNavigationToBigScreen(){
		return <SettingsRowGroup>
			<SettingsRowNavigateWithText labelLeft={"BigScreen"} route={route} />
		</SettingsRowGroup>
	}

	return <MySafeAreaView>
		<MyScrollView>
			<SettingsRowGroup>
				<SettingsRowCanteenSelection showArchived={true} onSelectCanteen={setSelectedCanteen} labelRight={canteenAlias} />
				{renderFoodofferCategorySelection(selectedFoodofferCategoryIds)}
				<SettingsRowBooleanSwitch value={showFoodofferCategoryName} accessibilityLabel={"Zeige Speiseangebot Kateogrie Name"} labelLeft={"Zeige Speiseangebot Kateogrie Name"} onPress={(nextValue: boolean) => setShowFoodofferCategoryName(nextValue)} />
				<SettingsRowNumberEdit value={nextFoodIntervalInSeconds} labelRight={nextFoodIntervalInSeconds?.toString()} onSave={(value) => setNextFoodIntervalInSeconds(value)} accessibilityLabel={"Next Food Interval"} labelLeft={"Next Food Interval"} />
				<SettingsRowNumberEdit value={refreshFoodOffersIntervalInSeconds} labelRight={refreshFoodOffersIntervalInSeconds?.toString()} onSave={(value) => setRefreshFoodOffersIntervalInSeconds(value)} accessibilityLabel={"Refresh Food Offers Interval"} labelLeft={"Refresh Food Offers Interval"} />
				<SettingsRowBooleanSwitch value={fullScreen} labelLeft={"Full Screen"} accessibilityLabel={"Full Screen"} onPress={(nextValue: boolean) => setFullScreen(nextValue)} />
				{renderFoodCategorySelection(selectedFoodCategoryIds)}
				<SettingsRowBooleanSwitch value={showFoodCategoryName} accessibilityLabel={"Zeige Speise Kateogrie Name"} labelLeft={"Zeige Speiseangebot Kateogrie Name"} onPress={(nextValue: boolean) => setShowFoodCategoryName(nextValue)} />
			</SettingsRowGroup>
			{renderDebugInfo()}
			{showNavigationToBigScreen()}
		</MyScrollView>
	</MySafeAreaView>

}