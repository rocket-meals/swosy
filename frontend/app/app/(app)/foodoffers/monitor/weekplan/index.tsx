import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowCanteenSelection} from "@/compositions/settings/SettingsRowProfileCanteen";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {SettingsRowNavigateWithText} from "@/components/settings/SettingsRowNavigate";
import {ExpoRouter} from "expo-router/types/expo-router";
import {getRouteToWeekplanCanteen} from "@/app/(app)/foodoffers/monitor/weekplan/canteens";
import {SettingsRowBooleanSwitch} from "@/components/settings/SettingsRowBooleanSwitch";

export function getRouteToWeekplan(){
	return "/(app)/foodoffers/monitor/weekplan" as ExpoRouter.Href;
}

export default function FoodOfferScreen() {

	const [selectedCanteen, setSelectedCanteen] = React.useState<Canteens | null>(null);
	const canteenAlias = selectedCanteen?.alias || selectedCanteen?.id || undefined
	const [showMarkings, setShowMarkings] = React.useState<boolean>(true);

	let route: null | ExpoRouter.Href = null;
	if(selectedCanteen){
		route = getRouteToWeekplanCanteen(selectedCanteen.id, showMarkings);
	}

	function showNavigationToWeekplanCanteen(){
		return <SettingsRowGroup>
			<SettingsRowNavigateWithText labelLeft={"Wochen Auswahl"} route={route} />
		</SettingsRowGroup>
	}

	return <MySafeAreaView>
		<MyScrollView>
			<SettingsRowGroup>
				<SettingsRowCanteenSelection showArchived={true} onSelectCanteen={setSelectedCanteen} labelRight={canteenAlias} />
				<SettingsRowBooleanSwitch value={showMarkings} onPress={(nextValue: boolean) => {
					setShowMarkings(nextValue)
				}} labelLeft={"Allergene Anzeigen"} accessibilityLabel={"Allergene Anzeigen"} />
			</SettingsRowGroup>
			{showNavigationToWeekplanCanteen()}
		</MyScrollView>
	</MySafeAreaView>

}