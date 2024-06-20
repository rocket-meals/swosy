import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {router} from "expo-router";
import {SEARCH_PARAM_CANTEENS_ID} from "@/app/(app)/foodoffers/weekplan/canteens";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowCanteenSelection} from "@/compositions/settings/SettingsRowProfileCanteen";
import {MySafeAreaView} from "@/components/MySafeAreaView";

export default function FoodOfferScreen() {

	const [selectedCanteen, setSelectedCanteen] = React.useState<Canteens | null>(null);
	const canteenAlias = selectedCanteen?.alias || selectedCanteen?.id || undefined
	const canteenId = selectedCanteen?.id || undefined

	function onSelectCanteen(canteen: Canteens){
		let canteen_id = canteen.id;
		router.push(`/(app)/foodoffers/weekplan/canteens/?${SEARCH_PARAM_CANTEENS_ID}=`+canteen_id);
	}

	return <MySafeAreaView>
		<MyScrollView>
			<SettingsRowGroup>
				<SettingsRowCanteenSelection onSelectCanteen={setSelectedCanteen} labelRight={canteenAlias} />
			</SettingsRowGroup>
		</MyScrollView>
	</MySafeAreaView>

}