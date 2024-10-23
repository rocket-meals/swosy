import React from "react";
import {Canteens} from "@/helper/database/databaseTypes/types";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowCanteenSelection} from "@/compositions/settings/SettingsRowProfileCanteen";
import {MySafeAreaView} from "@/components/MySafeAreaView";

export default function FoodOfferScreen() {

	const [selectedCanteen, setSelectedCanteen] = React.useState<Canteens | null>(null);
	const canteenAlias = selectedCanteen?.alias || selectedCanteen?.id || undefined

	return <MySafeAreaView>
		<MyScrollView>
			<SettingsRowGroup>
				<SettingsRowCanteenSelection showArchived={true} onSelectCanteen={setSelectedCanteen} labelRight={canteenAlias} />
			</SettingsRowGroup>
		</MyScrollView>
	</MySafeAreaView>

}