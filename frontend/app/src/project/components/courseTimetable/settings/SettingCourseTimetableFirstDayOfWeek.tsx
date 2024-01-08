import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../../translations/AppTranslation";
import {usePersonalCourseTimetableFirstDayOfWeek} from "../CourseTimetableHelper";
import {SettingsRowWeekday} from "../../settings/SettingsRowWeekday";
import {ProfileAPI, useSynchedProfile} from "../../profile/ProfileAPI";

export const SettingCourseTimetableFirstDayOfWeek: FunctionComponent = (props) => {
	const translationFirstDayOfWeek = useAppTranslation("firstDayOfWeek");

	const [profile, setProfile] = useSynchedProfile();
	const locale = ProfileAPI.getLocaleForJSDates(profile);
	const [firstDayOfWeek, setFirstDayOfWeek] = usePersonalCourseTimetableFirstDayOfWeek();

	function onSelectFirstDayOfWeek(key){
		setFirstDayOfWeek(key);
	}

	return(
			<SettingsRowWeekday weekday={firstDayOfWeek} onChange={onSelectFirstDayOfWeek} description={translationFirstDayOfWeek} locale={locale} />
	)
}
