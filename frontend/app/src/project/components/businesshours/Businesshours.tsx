import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {useDebugMode, useDemoMode, useSynchedBusinesshoursDict} from "../../helper/synchedJSONState";
import {BusinesshoursHelper} from "./BusinesshoursHelper";
import {SettingsRow} from "../settings/SettingsRow";
import {ProfileAPI, useSynchedProfile} from "../profile/ProfileAPI";
import {DateHelper} from "../../helper/DateHelper";

interface AppState {
	resource_ids: string[] | number[];
}
export const Businesshours: FunctionComponent<AppState> = (props) => {

	const [profile, setProfile] = useSynchedProfile();
	let locale = ProfileAPI.getLocaleForJSDates(profile);

	const [debug, setDebug] = useDebugMode()
	const [demo, setDemo] = useDemoMode()

	const resource_ids = props?.resource_ids || [];
	const [businesshours, setBusinesshours] = useSynchedBusinesshoursDict();

	const businesshoursList = resource_ids.map((resource_id) => {
		const businesshour = businesshours?.[resource_id];
		return businesshour;
	});

	const weekoverview = BusinesshoursHelper.getWeekOverview(businesshoursList);

	const rendered = [];

	const longestWeekdayName = "LongestWeekdayName";

	const renderedInvisibleTextForWidthCalculation = <Text selectable={false} style={{opacity: 0}}>{longestWeekdayName}</Text>;

	for (const weekday in weekoverview) {
		const businesshoursForDay = weekoverview[weekday];
		const translatedWeekday = DateHelper.getWeekdayTranslationByWeekday(weekday, locale);

		const renderedBusinesshoursForDay = [];
		const renderedWeekday = (
			<View style={{justifyContent: "flex-start"}}>
				<Text>{translatedWeekday}</Text>
				{renderedInvisibleTextForWidthCalculation}
			</View>
		);
		for(const businesshour of businesshoursForDay){
			const renderedTime = <Text>{BusinesshoursHelper.formatBusinesshours(businesshour?.time_start)+" - "+BusinesshoursHelper.formatBusinesshours(businesshour.time_end)}</Text>;
			renderedBusinesshoursForDay.push(renderedTime);
		}
		rendered.push(<SettingsRow leftIcon={renderedWeekday} leftContent={<View>{renderedBusinesshoursForDay}</View>} />)

	}

	if(debug) {
		rendered.push(<Text>{JSON.stringify(weekoverview, null, 2)}</Text>)
	}

	return <View>
		{rendered}
	</View>;
}
