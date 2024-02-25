import React from "react";
import {UtilizationDictData, UtilizationForecastRow} from "./UtilizationForecastRow";
import {UtilizationsEntries} from "@/helper/database/databaseTypes/types";
import {DateHelper} from "@/helper/date/DateHelper";
import {View, Text} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {AnimationThinking} from "@/compositions/animations/AnimationThinking";

export type UtilizationForecastProps = {
	utilizationEntires: UtilizationsEntries[] | undefined
}
export const UtilizationForecast = (props: UtilizationForecastProps) => {

	const translation_opens_at = useTranslation(TranslationKeys.opens_at)
	const translation_closed_after = useTranslation(TranslationKeys.closed_after)

	const translation_no_data_currently_calculating = useTranslation(TranslationKeys.no_data_currently_calculating);

	let utilization: UtilizationDictData = {};

	let utilizationEntries = props.utilizationEntires;


	let sortedEntries: UtilizationsEntries[] = []
	if (utilizationEntries) {
		sortedEntries = utilizationEntries.sort((a, b) => {
			let aDate = a.date_start
			let bDate = b.date_start
			if (aDate && bDate) {
				return new Date(aDate).getTime() - new Date(bDate).getTime()
			}
			if(aDate){
				return -1
			}
			if(bDate){
				return 1
			}
			return 0
		}	)
	}

	// for sortedEntries
	for (let entry of sortedEntries) {
		let date_start = entry.date_start
		let date_end = entry.date_end
		if (date_start && date_end) {
			let date_start_obj = new Date(date_start)
			let date_end_obj = new Date(date_end)
			let key = date_start_obj.toISOString()+date_end_obj.toISOString()
			let traffic = entry.value_real || entry.value_forecast_current || 0
			utilization[key] = {
				start: DateHelper.formatDateToHHMM(date_start_obj),
				end: DateHelper.formatDateToHHMM(date_end_obj),
				traffic: traffic
			};
		}
	}

	let entriesUndefined = !utilizationEntries
	let emptyListOfEntries = utilizationEntries && utilizationEntries.length === 0
	let content = <UtilizationForecastRow data={utilization} translation_closedAfter={translation_closed_after} translation_openedFrom={translation_opens_at} />
	if (entriesUndefined || emptyListOfEntries) { // TODO: maybe add another animation for emptyListOfEntries
		content = (
			<View style={{
				width: "100%",
				alignItems: "center",
				justifyContent: "center"
			}}>
				<Text>{
					translation_no_data_currently_calculating
				}</Text>
				<AnimationThinking />
			</View>
		)
	}

	return(
		<View style={{width: "100%"}}>
			{content}
		</View>
	)
}
