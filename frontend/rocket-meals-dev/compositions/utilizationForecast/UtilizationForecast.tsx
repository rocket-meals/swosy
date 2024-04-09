import React from 'react';
import {UtilizationDictData, UtilizationForecastRow} from './UtilizationForecastRow';
import {UtilizationsEntries} from '@/helper/database/databaseTypes/types';
import {DateHelper} from '@/helper/date/DateHelper';
import {Text, View} from '@/components/Themed';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {AnimationThinking} from '@/compositions/animations/AnimationThinking';
import {useIsDebug} from "@/states/Debug";

export type UtilizationForecastProps = {
	utilizationEntires: UtilizationsEntries[] | undefined
}
export const UtilizationForecast = (props: UtilizationForecastProps) => {
	const translation_opens_at = useTranslation(TranslationKeys.opens_at)
	const translation_closed_after = useTranslation(TranslationKeys.closed_after)
	const isDebug = useIsDebug()

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

	// for sortedEntries
	for (const entry of sortedEntries) {
		const date_start = entry.date_start
		const date_end = entry.date_end
		if (date_start && date_end) {
			const date_start_obj = new Date(date_start)
			const date_end_obj = new Date(date_end)
			const key = date_start_obj.toISOString()+date_end_obj.toISOString()
			const traffic = entry.value_real || entry.value_forecast_current || 0
			utilization[key] = {
				start: DateHelper.formatDateToHHMM(date_start_obj),
				end: DateHelper.formatDateToHHMM(date_end_obj),
				traffic: traffic
			};
		}
	}

	const entriesUndefined = !utilizationEntries
	const emptyListOfEntries = utilizationEntries && utilizationEntries.length === 0
	let content = <UtilizationForecastRow data={utilization} translation_closedAfter={translation_closed_after} translation_openedFrom={translation_opens_at} />
	if (entriesUndefined || emptyListOfEntries) { // TODO: maybe add another animation for emptyListOfEntries
		content = (
			<View style={{
				width: '100%',
				alignItems: 'center',
				justifyContent: 'center'
			}}
			>
				<Text>{
					translation_no_data_currently_calculating
				}
				</Text>
				<AnimationThinking />
			</View>
		)
	}

	function renderDebug() {
		if(isDebug) {
			return <View style={{
				width: '100%',
			}}>
				<Text>{JSON.stringify(utilizationEntries, null, 2)}</Text>
			</View>
		}
	}

	return (
		<View style={{width: '100%'}}>
			{content}
			{renderDebug()}
		</View>
	)
}
