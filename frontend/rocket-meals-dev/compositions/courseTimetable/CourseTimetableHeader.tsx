import React, {FunctionComponent} from "react";
import {useSettingTranslationCourseTimetable} from "./useSettingTranslationCourseTimetable";

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
