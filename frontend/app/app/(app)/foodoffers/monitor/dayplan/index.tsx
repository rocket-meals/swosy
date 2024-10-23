import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowCanteenSelection} from "@/compositions/settings/SettingsRowProfileCanteen";
import {useIsDemo} from "@/states/SynchedDemo";
import {useIsDebug} from "@/states/Debug";
import {SettingsRowNumberEdit} from "@/components/settings/SettingsRowNumberEdit";
import {ExpoRouter} from "expo-router/types/expo-router";
import {SettingsRowNavigateWithText} from "@/components/settings/SettingsRowNavigate";
import {getRouteToFoodofferDayplanScreen} from "@/app/(app)/foodoffers/monitor/dayplan/details";

export default function FoodoffersDayplanScreenSettings() {

	const isDebug = useIsDebug()
	const isDemo = useIsDemo()

	const [selectedCanteen, setSelectedCanteen] = React.useState<Canteens | null>(null);
	const [additionalCanteens, setAdditionalCanteens] = React.useState<Canteens[]>([]);
	const canteenAlias = selectedCanteen?.alias || selectedCanteen?.id || undefined
	const canteenId = selectedCanteen?.id || undefined

	let labelAdditionalCanteens = "Optional: Zusätzliche Mensa/Cafeteria";
	const aliasAdditionalCanteensString = additionalCanteens.map(canteen => canteen.alias || canteen.id).join(", ");

	const [nextPageIntervalInSeconds, setNextPageIntervalInSeconds] = React.useState<number | null | undefined>(10);
	const [refreshDataIntervalInSeconds, setRefreshDataIntervalInSeconds] = React.useState<number | null | undefined>(5*60);

	let route: null | ExpoRouter.Href = null;
	if(canteenId){
		const additionalCanteenIds = additionalCanteens.map(canteen => canteen.id);
		route = getRouteToFoodofferDayplanScreen(canteenId, nextPageIntervalInSeconds, refreshDataIntervalInSeconds, additionalCanteenIds);
	}

	function showNavigationToBigScreen(){
		return <SettingsRowGroup>
			<SettingsRowNavigateWithText labelLeft={"DayScreen"} route={route} />
		</SettingsRowGroup>
	}

	return <MySafeAreaView>
		<MyScrollView>
			<SettingsRowGroup>
				<SettingsRowCanteenSelection showArchived={true} onSelectCanteen={setSelectedCanteen} labelRight={canteenAlias} />
				<SettingsRowCanteenSelection showArchived={true} labelLeft={labelAdditionalCanteens} onSelectCanteen={(canteen) => {
					if(canteen){
						setAdditionalCanteens([canteen]);
					}
				}} labelRight={aliasAdditionalCanteensString} />
				<SettingsRowNumberEdit value={nextPageIntervalInSeconds} labelRight={nextPageIntervalInSeconds?.toString()} onSave={(value) => setNextPageIntervalInSeconds(value)} accessibilityLabel={"Next Food Interval"} labelLeft={"Next Food Interval"} />
				<SettingsRowNumberEdit value={refreshDataIntervalInSeconds} labelRight={refreshDataIntervalInSeconds?.toString()} onSave={(value) => setRefreshDataIntervalInSeconds(value)} accessibilityLabel={"Refresh Data Interval (seconds)"} labelLeft={"Refresh Data Interval (seconds)"} />
			</SettingsRowGroup>
			{showNavigationToBigScreen()}
		</MyScrollView>
	</MySafeAreaView>

}