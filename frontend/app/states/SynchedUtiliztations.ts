import {UtilizationsEntries, UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {DateHelper} from '@/helper/date/DateHelper';

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

	// if saturday or sunday return empty array
	if (date.getDay() === 0 || date.getDay() === 6) {
		return utilizationEntries;
	}

	const start = new Date(date);
	// set start to 10:00
	start.setHours(10)
	start.setMinutes(0)
	start.setSeconds(0)
	start.setMilliseconds(0)

	const end = new Date(date);
	// set end to 17:00
	end.setHours(17)
	end.setMinutes(0)
	end.setSeconds(0)
	end.setMilliseconds(0)

	const peak = new Date(date);
	peak.setHours(12)
	peak.setMinutes(0)
	peak.setSeconds(0)
	peak.setMilliseconds(0)

	// create utilization entries for every 15 minutes
	const current = new Date(start);
	while (current < end) {
		const date_start = current.toISOString();
		const date_end = new Date(current);
		date_end.setMinutes(date_end.getMinutes() + 15);

		// let value_forecast_current start at 10 and has its peak at 12:00 and then goes down to 10 again
		const value_at_peak = 100;
		const value_at_start = 10;
		const minutes_to_peak_from_start = (peak.getTime() - start.getTime()) / 1000 / 60;
		const minutes_to_peak_from_end = (end.getTime() - peak.getTime()) / 1000 / 60;
		let value_forecast_current = value_at_start
		if (current < peak) {
			// interpolate between value_at_start and value_at_peak with a s-curve which starts as value_at_start and ends as value_at_peak
			const t = (current.getTime() - start.getTime()) / 1000 / 60;
			const x = t / minutes_to_peak_from_start;
			value_forecast_current = value_at_start + (value_at_peak - value_at_start) * (x * x * (3 - 2 * x));
		} else {
			// interpolate between value_at_peak and value_at_start with a s-curve which starts as value_at_peak and ends as value_at_start
			const t = (current.getTime() - peak.getTime()) / 1000 / 60;
			const x = t / minutes_to_peak_from_end;
			value_forecast_current = value_at_peak + (value_at_start - value_at_peak) * (x * x * (3 - 2 * x));
		}



		const utilizationEntry: UtilizationsEntries = {
			date_start: current.toISOString(),
			date_end: date_end.toISOString(),
			date_updated: new Date().toISOString(),
			date_created: new Date().toISOString(),
			id: 'demo'+current.toISOString(),
			value_forecast_current: value_forecast_current,
			value_real: value_forecast_current
		};
		utilizationEntries.push(utilizationEntry);
		current.setMinutes(current.getMinutes() + 15);
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