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

export default function FoodBigScreenSettings() {

	const isDebug = useIsDebug()
	const isDemo = useIsDemo()

	const [selectedCanteen, setSelectedCanteen] = React.useState<Canteens | null>(null);
	const canteenAlias = selectedCanteen?.alias || selectedCanteen?.id || undefined
	const canteenId = selectedCanteen?.id || undefined

	const [nextFoodIntervalInSeconds, setNextFoodIntervalInSeconds] = React.useState<number | null | undefined>(10);
	const [refreshFoodOffersIntervalInSeconds, setRefreshFoodOffersIntervalInSeconds] = React.useState<number | null | undefined>(5*60);

	const [fullScreen, setFullScreen] = React.useState<boolean>(true);

	const [foodCategories, setFoodCategories] = React.useState<string[]>([]);
	const [foodCategory, setFoodCategory] = React.useState<string | null | undefined>(null);
	const options: MyModalActionSheetItem[] = foodCategories.map((category) => {
		return {
			key: category,
			active: category === foodCategory,
			label: category,
			accessibilityLabel: category,
			onSelect: (key: string, hide: () => void) => {
				setFoodCategory(key);
				hide();
			}
		}
	});

	let route: null | ExpoRouter.Href = null;
	if(canteenId){
		route = getRouteToFoodBigScreen(canteenId, foodCategory, nextFoodIntervalInSeconds, fullScreen);
	}

	async function loadAllFoodOffers(){
		const categories = await loadFoodCategoriesForNext7Days(isDemo);
		setFoodCategories(categories);
	}

	React.useEffect(() => {
		// load all food offers
		loadAllFoodOffers();
	}, [])


	const renderFoodCategorySelection = () => {
		// Auf den TVs wird ein TV
		// ·         Pasta&Friends,
		// ·         einer Fleisch und Meer,
		// ·         einer Veggie und Vegan,
		// ·         einer Queerbeet,
		// ·         einer Evergreens

		return <SettingsRowOptionWithCustomInput options={{
			onCustomInputSave: (value: string | undefined | null) => {
				setFoodCategory(value);
			},
			currentValue: foodCategory,
			title: "Select Food Category",
			items: options
		}} labelLeft="Category" accessibilityLabel={"Category"} labelRight={foodCategory} />
	}

	function renderDebugInfo(){
		if(isDebug){
			return <SettingsRowGroup>
				<View>
					<Text>
						{JSON.stringify(foodCategories, null, 2)}
					</Text>
				</View>
			</SettingsRowGroup>
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
				{renderFoodCategorySelection()}
				<SettingsRowNumberEdit value={nextFoodIntervalInSeconds} labelRight={nextFoodIntervalInSeconds?.toString()} onSave={(value) => setNextFoodIntervalInSeconds(value)} accessibilityLabel={"Next Food Interval"} labelLeft={"Next Food Interval"} />
				<SettingsRowNumberEdit value={refreshFoodOffersIntervalInSeconds} labelRight={refreshFoodOffersIntervalInSeconds?.toString()} onSave={(value) => setRefreshFoodOffersIntervalInSeconds(value)} accessibilityLabel={"Refresh Food Offers Interval"} labelLeft={"Refresh Food Offers Interval"} />
				<SettingsRowBooleanSwitch value={fullScreen} labelLeft={"Full Screen"} accessibilityLabel={"Full Screen"} onPress={(nextValue: boolean) => setFullScreen(nextValue)} />
			</SettingsRowGroup>
			{renderDebugInfo()}
			{showNavigationToBigScreen()}
		</MyScrollView>
	</MySafeAreaView>

}