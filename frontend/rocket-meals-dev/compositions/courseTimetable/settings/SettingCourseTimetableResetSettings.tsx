import React, {FunctionComponent} from "react";
import {AppTranslation, useAppTranslation} from "../../translations/AppTranslation";
import {
	useCourseTimetableEvents,
	usePersonalCourseTimetableAmountDaysOnScreen, usePersonalCourseTimetableSettings,
	usePersonalCourseTimetableTitleIntelligent
} from "../CourseTimetableHelper";
import {SettingsRowBooleanSwitch} from "../../settings/SettingsRowBooleanSwitch";
import {TitleIcon} from "../../icons/TitleIcon";
import {Icon, MyActionsheet} from "../../../../kitcheningredients";
import {SettingsRow} from "../../settings/SettingsRow";

interface AppState {
}
export const SettingCourseTimetableResetSettings: FunctionComponent<AppState> = (props) => {

	const [timetableSettings, setTimetableSettings] = usePersonalCourseTimetableSettings()

	const actionsheet = MyActionsheet.useActionsheet();

	const translationReset = useAppTranslation("reset");
	const translationScreenName = useAppTranslation("settings");
	const rowTitle = translationReset+": "+translationScreenName;

	function onReset(){
		setTimetableSettings({});
	}

	function showConfirmDialog(){
		actionsheet.show({
			title: rowTitle,
			acceptLabel: translationReset,
			cancelLabel: <AppTranslation id={"cancel"} />,
			onAccept: () => {
				onReset()
			}
		})
	}

	return(
		<SettingsRow leftContent={rowTitle} leftIcon={<Icon name={"trash-can"} />} onPress={() => {
			showConfirmDialog()
		}} />
	)
}
