import React, {FunctionComponent} from "react";
import {View, Text} from "native-base";
import {
	useDebugMode,
	useDemoMode,
	useSynchedSettingsFoods,
	useSynchedSettingsUtilizations
} from "../../../helper/synchedJSONState";
import {UtilizationForecastRow} from "./UtilizationForecastRow";
import {DateHelper} from "../../../helper/DateHelper";

export const UtilizationForecast: FunctionComponent = (props) => {

	let paramcanteenId = props?.canteenid;
	let paramDate = props?.date;

	const [utilizationSettings, setUtilizationSettings] = useSynchedSettingsUtilizations();
	const visible = utilizationSettings?.["enabled"]
	const [debug, setDebug] = useDebugMode()
	const [demo, setDemo] = useDemoMode();


	let utilization = {}

	if(demo){
		utilization = getDemoUtilization()
	} else {
		// TODO: Implement correct download of forecast data
	}

	function getDemoUtilization() {
		let utilization = {};

		let startTime = new Date(2020, 0, 1, 10, 0, 0); // Jan 1, 2020, 10:00 AM
		let endTime = new Date(2020, 0, 1, 17, 0, 0); // Jan 1, 2020, 5:00 PM

		for (let i = 0; startTime < endTime; i++) {
			let currentStart = new Date(startTime.getTime());
			startTime.setMinutes(startTime.getMinutes() + 15)
			let currentEnd = new Date(startTime.getTime());

			let traffic;
			switch (i % 3) {
				case 0:
					traffic = 20;
					break;
				case 1:
					traffic = 50;
					break;
				case 2:
					traffic = 90;
					break;
			}

			DateHelper.formatDateToHHMM(currentStart)

			let key = DateHelper.formatDateToHHMM(currentStart);
			utilization[key] = {
				start: DateHelper.formatDateToHHMM(currentStart),
				end: DateHelper.formatDateToHHMM(currentEnd),
				traffic: traffic
			};
		}

		return utilization;
	}


	if(!visible && !demo){
		return null;
	} else {
		return(
			<View style={{width: "100%"}}>
				<UtilizationForecastRow utilization={utilization} />
			</View>
		)
	}
}
