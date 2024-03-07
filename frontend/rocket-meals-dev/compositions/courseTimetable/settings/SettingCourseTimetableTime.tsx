import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../../translations/AppTranslation";
import {
	usePersonalCourseTimetableTime,
	usePersonalCourseTimetableTimeEnd,
	usePersonalCourseTimetableTimeStart
} from "../CourseTimetableHelper";
import {SettingsRowTimeEditComponent} from "../../settings/SettingsRowTimeEditComponent";
import {TimeStartIcon} from "../../icons/TimeStartIcon";
import {TimeEndIcon} from "../../icons/TimeEndIcon";

interface AppState {
	start: boolean
}
export const SettingCourseTimetableTime: FunctionComponent<AppState> = (props) => {

	const start = props?.start || false;

	const translationStart = useAppTranslation("courseTimetableDayStartTime");
	const translationEnd = useAppTranslation("courseTimetableDayEndTime");

	const translationSave = useAppTranslation("save");
	const translationCancel = useAppTranslation("cancel");

	const icon = start ? <TimeStartIcon/> : <TimeEndIcon/>;

	const translationTime = start ? translationStart : translationEnd;

	const [startTime, setStartTime] = usePersonalCourseTimetableTimeStart();
	const [endTime, setEndTime] = usePersonalCourseTimetableTimeEnd();
	const time = start ? startTime : endTime;
	const setTime = start ? setStartTime : setEndTime;

	function onChange(newTime: string): boolean{
		let hours = parseInt(newTime.split(":")[0]);
		setTime(hours+":00");
		return true;
	}

	return(
		<SettingsRowTimeEditComponent
			icon={icon}
			description={translationTime}
			onChange={onChange}
			initialValue={time}
			placeholder={"HH:00"}
			saveText={translationSave}
			cancelText={translationCancel}  />
	)
}
