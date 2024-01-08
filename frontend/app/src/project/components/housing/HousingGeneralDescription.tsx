import React, {FunctionComponent} from "react";
import {useSynchedSettingsHousing} from "../../helper/synchedJSONState";
import {View, Text} from "native-base";
import {DirectusTranslatedMarkdown} from "../translations/DirectusTranslatedMarkdown";
import {DefaultComponentCard} from "../detailsComponent/DefaultComponentCard";


interface AppState {

}
export const HousingGeneralDescription: FunctionComponent<AppState> = (props) => {

	const [settingsHousing, setSettingsHousing] = useSynchedSettingsHousing();

	return <View style={{width: "100%"}}>
		<DefaultComponentCard variableHeight={true} small={true} renderTop={() => <View></View>} renderTopForeground={null} renderBottom={(backgroundColor, textColor) => {
			return <View>
				<DirectusTranslatedMarkdown color={textColor} key={"housing_general_description"} field={"description"} item={settingsHousing} />
			</View>
		}} />
	</View>;

}
