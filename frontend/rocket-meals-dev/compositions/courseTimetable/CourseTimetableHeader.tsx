import React, {FunctionComponent} from "react";
import {HeaderWithActions, Navigation} from "../../../kitcheningredients";
import {Button, Tooltip, View} from "native-base";
import {useAppTranslation} from "../translations/AppTranslation";
import {SettingsIcon} from "../icons/SettingsIcon";
import {SettingCourseTimetable} from "../../screens/settings/SettingCourseTimetable";
import {useSettingTranslationCourseTimetable} from "./SettingTranslationCourseTimetable";

export interface AppState{

}
export const CourseTimetableHeader: FunctionComponent<AppState> = (props) => {

	const translationSettings = useSettingTranslationCourseTimetable();
	const translationScreenNameCourseTimetable = useAppTranslation("screenNameCourseTimetable")

	// view-day vs view-week

	function renderActions(){
		return(
			<>
				<Tooltip label={translationSettings}>
					<Button style={{backgroundColor: "transparent"}}
							onPress={() => {
								Navigation.navigateTo(SettingCourseTimetable, {showbackbutton: true})
//								NavigatorHelper.navigateWithoutParams(SettingCourseTimetable, false, {showbackbutton: true});
							}}>
						<SettingsIcon accessibilityLabel={translationSettings} />
					</Button>
				</Tooltip>
			</>
		)
	}

	function renderCustomBottom(){
		return(
			<>
				<View style={{flex: 1}}>

				</View>
				<View style={{justifyContent: "center", alignItems: "center", flexDirection: "row"}}>

				</View>
				<View style={{flex: 1}}>

				</View>
			</>
		)
	}

	return(
		<HeaderWithActions route={props?.route} title={translationScreenNameCourseTimetable} renderActions={renderActions} renderCustomBottom={renderCustomBottom} />
	)
}
