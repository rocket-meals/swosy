import {UtilizationsEntries, UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {DateHelper} from '@/helper/date/DateHelper';
import {ItemStatus} from "@/helper/database/ItemStatus";

export const TABLE_NAME_UTILIZATIONS_ENTRIES = 'utilizations_entries';
export const TABLE_NAME_UTILIZATIONS_GROUPS = 'utilizations_groups';
export async function loadUtilizationEntriesRemote(utilizationGroup: UtilizationsGroups, dateIsoString: string, isDemo: boolean): Promise<UtilizationsEntries[] | undefined> {
	let utilizationEntries: UtilizationsEntries[] | undefined = undefined;
	let date = new Date(dateIsoString);
	if (isDemo) {
		utilizationEntries = getDemoUtilizationEntries(date);
		return utilizationEntries;
	} else {
		const utilizationEntriesHelper = new CollectionHelper<UtilizationsEntries>(TABLE_NAME_UTILIZATIONS_ENTRIES);
		const date_start = new Date(date);
		date_start.setHours(0,0,0,0);

		const date_end = new Date(date_start);
		date_end.setDate(date_end.getDate() + 1);

		utilizationEntries = await utilizationEntriesHelper.readItems({
			filter: {
				_and: [
					{
						date_start: {
							_gte: DateHelper.formatDateToIso8601WithoutTimezone(date_start)
						}
					},
					{
						date_end: {
							_lte: DateHelper.formatDateToIso8601WithoutTimezone(date_end)
						}
					},
					{
						utilization_group: {
							_eq: utilizationGroup.id
						}
					}
				]
			},
			limit: -1
		});
		console.log('loadUtilizationEntriesRemote', utilizationEntries);

		return utilizationEntries;
	}
}


function getDemoUtilizationEntries(date: Date): UtilizationsEntries[] | undefined {
	const now = new Date();

	// if date is further than 7 days in the future return undefined
	if (DateHelper.getAmountDaysDifference(date, now) > 7) {
		return undefined;
	}

	const utilizationEntries: UtilizationsEntries[] = [];

	const isWeekend = date.getDay() === 0 || date.getDay() === 6;

	const startInMinutes = 10 * 60; // 10:00
	const peakInMinutes = 12 * 60; // 12:00
	const endInMinutes = 17 * 60; // 17:00

	const value_at_peak = 3000;
	const value_at_start = 100;
	const minutesPerDay = 24 * 60;
	const step = 15;

	const minutes_to_peak_from_start = (peakInMinutes - startInMinutes);
	const minutes_to_peak_from_end = (endInMinutes - peakInMinutes);

	// create utilization entries for every 15 minutes
	for(let i = 0; i < minutesPerDay; i += step) {
		const current = i;
		// let value_forecast_current start at 10 and has its peak at 12:00 and then goes down to 10 again
		let value = 0;

		if(current >= startInMinutes && current <= endInMinutes && !isWeekend) {
			if (current < peakInMinutes) {
				// interpolate between value_at_start and value_at_peak with a s-curve which starts as value_at_start and ends as value_at_peak
				const t = (current - startInMinutes);
				const x = t / minutes_to_peak_from_start;
				value = value_at_start + (value_at_peak - value_at_start) * (x * x * (3 - 2 * x));
			} else {
				// interpolate between value_at_peak and value_at_start with a s-curve which starts as value_at_peak and ends as value_at_start
				const t = (current - peakInMinutes);
				const x = t / minutes_to_peak_from_end;
				value = value_at_peak + (value_at_start - value_at_peak) * (x * x * (3 - 2 * x));
			}
		}


		const current_date = new Date(date);
		current_date.setMinutes(i);
		current_date.setSeconds(0);
		current_date.setMilliseconds(0);

		const current_date_end = new Date(current_date);
		current_date_end.setMinutes(i + step);

		const isCurrentEndDateInFuture = current_date_end.getTime() > now.getTime();
		const value_forecast_current = isCurrentEndDateInFuture ? value : value
		const value_real = isCurrentEndDateInFuture ? undefined : value

		const utilizationEntry: UtilizationsEntries = {
			date_start: DateHelper.formatDateToIso8601WithoutTimezone(current_date),
			date_end: DateHelper.formatDateToIso8601WithoutTimezone(current_date_end),
			date_updated: new Date().toISOString(),
			date_created: new Date().toISOString(),
			id: 'demo'+current_date.toISOString(),
			status: ItemStatus.PUBLISHED,
			value_forecast_current: value_forecast_current,
			value_real: value_real
		};
		utilizationEntries.push(utilizationEntry);
	}

	return utilizationEntries;
}

export function getDemoUtilizationGroup(): UtilizationsGroups {
	return {
		utilization_entries: [],
		id: 'demo',
		date_created: new Date().toISOString(),
		date_updated: new Date().toISOString(),
		alias: 'Demo Utilization Group',
		status: '',
		user_created: undefined,
		user_updated: undefined
	};
}