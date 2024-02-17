import React, {FunctionComponent} from "react";
import {UtilizationDictData, UtilizationForecastRow} from "./UtilizationForecastRow";
import {UtilizationsGroups} from "@/helper/database/databaseTypes/types";
import {DateHelper} from "@/helper/date/DateHelper";
import {useIsDemo} from "@/states/SynchedDemo";
import {View} from "@/components/Themed";

export type UtilizationForecastProps = {
	utilizationGroups: UtilizationsGroups
}
export const UtilizationForecast = (props: UtilizationForecastProps) => {

	const visible = true; // TODO: Read from synchronized app_settings

	const demo = useIsDemo()

	let utilization = {}

	if(demo){
		utilization = getDemoUtilization()
	} else {
		// TODO: Implement correct download of forecast data
	}

	function getDemoUtilization() {
		let utilization: UtilizationDictData = {};

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
				<UtilizationForecastRow data={utilization}  translation_closedAfter={
					"closed after"
				}
										translation_openedFrom={
											"opened from"
										}
				/>
			</View>
		)
	}
}
