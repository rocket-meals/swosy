import React, {FunctionComponent} from "react";
import {Text} from "native-base";
import {Icon, MyActionsheet} from "../../../../kitcheningredients";
import {AppTranslation, useAppTranslation} from "../../translations/AppTranslation";
import {ProfileAPI, useSynchedProfile} from "../../profile/ProfileAPI";
import {
	usePersonalCourseTimetableFirstDayOfWeek,
	usePersonalCourseTimetableAmountDaysOnScreen,
	usePersonalCourseTimetableTime
} from "../CourseTimetableHelper";
import {DateHelper} from "../../../helper/DateHelper";
import {SettingsRow} from "../../settings/SettingsRow";
import {SettingsRowTimeEditComponent} from "../../settings/SettingsRowTimeEditComponent";
import {TimeStartIcon} from "../../icons/TimeStartIcon";
import {TimeEndIcon} from "../../icons/TimeEndIcon";
import {SettingsRowNumberEditComponent} from "../../settings/SettingsRowNumberEditComponent";

interface AppState {
}
export const SettingCourseTimetableAmountDaysToShowAtOnce: FunctionComponent<AppState> = (props) => {

	const translationDaysPerPage = useAppTranslation("daysPerPage");

	const translationIntelligent = useAppTranslation("intelligent");

	const translationSave = useAppTranslation("save");
	const translationCancel = useAppTranslation("cancel");

	const icon = <Icon name={"view-week"} />;

	const [amountDaysOnScreen, setAmountDaysOnScreen] = usePersonalCourseTimetableAmountDaysOnScreen();

	function onChange(newAmount: number): boolean{
		if(newAmount <= 0){
			newAmount = 0;
		}
		if(newAmount > 7){
			newAmount = 7;
		}
		setAmountDaysOnScreen(newAmount);
		return true;
	}

	const initialValue = amountDaysOnScreen === 0 ? undefined : amountDaysOnScreen;

	return(
		<SettingsRowNumberEditComponent
			icon={icon}
			description={translationDaysPerPage}
			onChange={onChange}
			emptyValue={translationIntelligent}
			initialValue={initialValue}
			placeholder={"0-7 (0 = "+translationIntelligent+")"}
			saveText={translationSave}
			cancelText={translationCancel}  />
	)
}
