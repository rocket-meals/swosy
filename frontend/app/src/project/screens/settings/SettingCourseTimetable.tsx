import React, {FunctionComponent, useEffect} from "react";
import {View} from "native-base";
import {SettingCourseTimetableFirstDayOfWeek} from "../../components/courseTimetable/settings/SettingCourseTimetableFirstDayOfWeek";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {SettingCourseTimetableReset} from "../../components/courseTimetable/settings/SettingCourseTimetableReset";
import {SettingCourseTimetableTime} from "../../components/courseTimetable/settings/SettingCourseTimetableTime";
import {SettingCourseTimetableAmountDaysToShowAtOnce} from "../../components/courseTimetable/settings/SettingCourseTimetableAmountDaysToShowAtOnce";
import {SettingCourseTimetableIntelligentTitle} from "../../components/courseTimetable/settings/SettingCourseTimetableIntelligentTitle";
import {SettingCourseTimetableResetSettings} from "../../components/courseTimetable/settings/SettingCourseTimetableResetSettings";

export const SettingCourseTimetable: FunctionComponent = (props) => {

	// corresponding componentDidMount
	useEffect(() => {

	}, [props?.route?.params])

	return(
		<View style={{width: "100%"}}>
			<SettingCourseTimetableFirstDayOfWeek />
			<SettingCourseTimetableTime start={true} />
			<SettingCourseTimetableTime start={false} />
			<SettingCourseTimetableAmountDaysToShowAtOnce />
			<SettingCourseTimetableIntelligentTitle />
			<SettingsSpacer />
			<SettingCourseTimetableResetSettings />
			<SettingsSpacer />
			<SettingCourseTimetableReset />
		</View>
	)
}
