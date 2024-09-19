import React from 'react';
import {
	clampNumberToPercentage,
	Percentage,
	UtilizationDictData,
	UtilizationForecastRow
} from './UtilizationForecastRow';
import {UtilizationsEntries, UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import {DateHelper} from '@/helper/date/DateHelper';
import {Text, View} from '@/components/Themed';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {AnimationThinking} from '@/compositions/animations/AnimationThinking';
import {useIsDebug} from "@/states/Debug";
import { ScrollView } from 'react-native';

export type UtilizationForecastProps = {
	utilizationEntires: UtilizationsEntries[] | undefined
	utilizationGroup: UtilizationsGroups
}
export const UtilizationForecast = (props: UtilizationForecastProps) => {
	const isDebug = useIsDebug()

	const utilizationGroup = props.utilizationGroup

	const translation_no_data_currently_calculating = useTranslation(TranslationKeys.no_data_currently_calculating);

	const utilization: UtilizationDictData = {};

	const utilizationEntries = props.utilizationEntires;


	let sortedEntries: UtilizationsEntries[] = []
	if (utilizationEntries) {
		sortedEntries = utilizationEntries.sort((a, b) => {
			const aDate = a.date_start
			const bDate = b.date_start
			if (aDate && bDate) {
				return new Date(aDate).getTime() - new Date(bDate).getTime()
			}
			if (aDate) {
				return -1
			}
			if (bDate) {
				return 1
			}
			return 0
		}	)
	}

	let max = utilizationGroup.threshold_until_max || utilizationGroup.all_time_high || 100

	// for sortedEntries
	let entryIndex = 0
	for (const entry of sortedEntries) {
		const date_start = entry.date_start
		const date_end = entry.date_end
		if (date_start && date_end) {
			const date_start_obj = new Date(date_start)
			const date_end_obj = new Date(date_end)
			const key = date_start_obj.toISOString()+date_end_obj.toISOString()
			const value_unscaled = entry.value_real || entry.value_forecast_current || 0

			let percentage = value_unscaled / max * 100

			utilization[key] = {
				start: DateHelper.formatDateToHHMM(date_start_obj),
				end: DateHelper.formatDateToHHMM(date_end_obj),
				percentage: clampNumberToPercentage(percentage)
			};
		}
		entryIndex++
	}

	let percentage_until_low = clampNumberToPercentage(50);
	if(utilizationGroup.threshold_until_low) {
		percentage_until_low = clampNumberToPercentage(utilizationGroup.threshold_until_low)
	}
	let percentage_until_medium = clampNumberToPercentage(65);
	if(utilizationGroup.threshold_until_medium) {
		percentage_until_medium = clampNumberToPercentage(utilizationGroup.threshold_until_medium)
	}
	let percentage_until_high = clampNumberToPercentage(80);
	if(utilizationGroup.threshold_until_high) {
		percentage_until_high = clampNumberToPercentage(utilizationGroup.threshold_until_high)
	}

	const entriesUndefined = !utilizationEntries
	const emptyListOfEntries = utilizationEntries && utilizationEntries.length === 0
	const listOfEntriesAllValuesZero = utilizationEntries && utilizationEntries.every(entry => {
		return entry.value_forecast_current === 0 || entry.value_forecast_current === null || entry.value_forecast_current === undefined
	})

	let content = <UtilizationForecastRow data={utilization} percentage_until_low={percentage_until_low} percentage_until_medium={percentage_until_medium} percentage_until_high={percentage_until_high} />
	if (entriesUndefined || emptyListOfEntries || listOfEntriesAllValuesZero) { // TODO: maybe add another animation for emptyListOfEntries
		content = (
			<View style={{
				width: '100%',
				alignItems: 'center',
				justifyContent: 'center'
			}}
			>
				<Text>{translation_no_data_currently_calculating}</Text>
				<AnimationThinking />
			</View>
		)
	}

	function renderDebug() {
		if(isDebug) {
			return (
				<View style={{
					width: '100%',
				}}>
					<Text>{"utilizationGroup.all_time_high: "+utilizationGroup.all_time_high}</Text>
					<Text>{"max: "+max}</Text>
					<Text>{"utilizationGroup.threshold_until_low: "+utilizationGroup.threshold_until_low}</Text>
					<Text>{"percentage_until_low: "+percentage_until_low}</Text>
					<Text>{"utilizationGroup.threshold_until_medium: "+utilizationGroup.threshold_until_medium}</Text>
					<Text>{"percentage_until_medium: "+percentage_until_medium}</Text>
					<Text>{"utilizationGroup.threshold_until_high: "+utilizationGroup.threshold_until_high}</Text>
					<Text>{"percentage_until_high: "+percentage_until_high}</Text>
					<Text>{"listOfEntriesAllValuesZero: "+listOfEntriesAllValuesZero}</Text>
					<Text>{JSON.stringify(utilizationEntries, null, 2)}</Text>
				</View>
			)
		}
	}

	return (
		<ScrollView style={{
			width: '100%',
		}}>
		<View style={{width: '100%'}}>
			{content}
			{renderDebug()}
		</View>
		</ScrollView>
	)
}
