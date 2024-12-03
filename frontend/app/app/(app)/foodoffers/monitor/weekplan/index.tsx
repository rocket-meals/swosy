import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowCanteenSelection} from "@/compositions/settings/SettingsRowProfileCanteen";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {SettingsRowNavigateWithText} from "@/components/settings/SettingsRowNavigate";
import {ExpoRouter} from "expo-router/types/expo-router";
import {getRouteToWeekplanCanteen} from "@/app/(app)/foodoffers/monitor/weekplan/canteens";

export default function FoodOfferScreen() {

	const [selectedCanteen, setSelectedCanteen] = React.useState<Canteens | null>(null);
	const canteenAlias = selectedCanteen?.alias || selectedCanteen?.id || undefined

	let route: null | ExpoRouter.Href = null;
	if(selectedCanteen){
		route = getRouteToWeekplanCanteen(selectedCanteen.id);
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
			</SettingsRowGroup>
			{showNavigationToWeekplanCanteen()}
		</MyScrollView>
	</MySafeAreaView>

}