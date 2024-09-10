import React, {FunctionComponent} from 'react';
import {Businesshours} from '@/helper/database/databaseTypes/types';
import {Text, View} from "@/components/Themed";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {useSynchedFirstWeekday} from "@/states/SynchedFirstWeekday";
import {useIsDebug} from "@/states/Debug";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";


export const BusinesshourTableRow = ({time_start, time_end, weekdayStart, translation_until, weekdayEnd, locale, ...props}: {translation_until: string, weekdayStart: Weekday, weekdayEnd: Weekday, locale: string, time_start:  string, time_end: string}) => {
	let start = time_start // "08:00:00"
	let end = time_end // "15:00:00"

	// remove seconds if there are more than 2 ":"
	if(start.split(":").length > 2) {
		start = start.split(":").slice(0, 2).join(":")
	}
	if(end.split(":").length > 2) {
		end = end.split(":").slice(0, 2).join(":")
	}


	const labelRight = start + " - " + end
	const accessibilityLabelRight = start + " "+translation_until+" " + end;

	const weekdayStartTranslation = DateHelper.getWeekdayTranslationByWeekday(weekdayStart, locale);
	const weekdayEndTranslation = DateHelper.getWeekdayTranslationByWeekday(weekdayEnd, locale);

	let labelLeft = weekdayStartTranslation + " - " + weekdayEndTranslation;
	let accessibilityLabelLeft =  weekdayStartTranslation + " "+translation_until+" " + weekdayEndTranslation;
	if(weekdayStart === weekdayEnd) {
		labelLeft = weekdayStartTranslation;
	}

	const accessibilityLabel = accessibilityLabelLeft + " " + accessibilityLabelRight;

	return <SettingsRow labelLeft={labelLeft} accessibilityLabel={accessibilityLabel} labelRight={labelRight} />
}

interface AppState {
	businesshours: Businesshours[] | undefined
}
export const BusinesshoursTable: FunctionComponent<AppState> = ({businesshours, ...props}) => {

	const translation_no_data_found = useTranslation(TranslationKeys.no_data_found);

	const locale = useProfileLocaleForJsDate();
	const isDebug = useIsDebug();

	const translation_until = useTranslation(TranslationKeys.until);

	const [firstDayOfWeek, setFirstDayOfWeek] = useSynchedFirstWeekday()
	const weekdayOrder: Weekday[] = DateHelper.getWeekdayEnumsValues(firstDayOfWeek);

	let renderedEntries: any[] = [];

	/**
	 * Example businesshours object:
	 * [
	 *   {
	 *     "valid_days": "",
	 *     "valid_range": "",
	 *     "id": "1",
	 *     "time_start": "08:00:00",
	 *     "time_end": "15:00:00",
	 *     "monday": true
	 *   },
	 *   {
	 *     "valid_days": "",
	 *     "valid_range": "",
	 *     "id": "2",
	 *     "date_valid_from": "2024-03-23T22:30:47.444Z",
	 *     "date_valid_till": "2024-03-30T22:30:47.444Z",
	 *     "time_start": "08:00:00",
	 *     "time_end": "16:00:00",
	 *     "wednesday": true,
	 *     "thursday": true,
	 *     "friday": true,
	 *     "saturday": true
	 *   },
	 *   {
	 *     "valid_days": "",
	 *     "valid_range": "",
	 *     "id": "3",
	 *     "time_start": "08:00:00",
	 *     "time_end": "16:00:00",
	 *     "wednesday": true,
	 *     "thursday": true,
	 *     "friday": true,
	 *     "saturday": true
	 *   },
	 *   {
	 *     "valid_days": "",
	 *     "valid_range": "",
	 *     "id": "1.1",
	 *     "time_start": "16:00:00",
	 *     "time_end": "20:00:00",
	 *     "monday": true
	 *   }
	 * ]
	 */

	const businesshoursForMondayWithoutValidFromAndValidTill = businesshours?.filter(businesshour => businesshour.monday && !businesshour.date_valid_from && !businesshour.date_valid_till);
	const businesshoursForTuesdayWithoutValidFromAndValidTill = businesshours?.filter(businesshour => businesshour.tuesday && !businesshour.date_valid_from && !businesshour.date_valid_till);
	const businesshoursForWednesdayWithoutValidFromAndValidTill = businesshours?.filter(businesshour => businesshour.wednesday && !businesshour.date_valid_from && !businesshour.date_valid_till);
	const businesshoursForThursdayWithoutValidFromAndValidTill = businesshours?.filter(businesshour => businesshour.thursday && !businesshour.date_valid_from && !businesshour.date_valid_till);
	const businesshoursForFridayWithoutValidFromAndValidTill = businesshours?.filter(businesshour => businesshour.friday && !businesshour.date_valid_from && !businesshour.date_valid_till);
	const businesshoursForSaturdayWithoutValidFromAndValidTill = businesshours?.filter(businesshour => businesshour.saturday && !businesshour.date_valid_from && !businesshour.date_valid_till);
	const businesshoursForSundayWithoutValidFromAndValidTill = businesshours?.filter(businesshour => businesshour.sunday && !businesshour.date_valid_from && !businesshour.date_valid_till);

	const businesshoursForWeekdays = {
		[Weekday.MONDAY]: businesshoursForMondayWithoutValidFromAndValidTill,
		[Weekday.TUESDAY]: businesshoursForTuesdayWithoutValidFromAndValidTill,
		[Weekday.WEDNESDAY]: businesshoursForWednesdayWithoutValidFromAndValidTill,
		[Weekday.THURSDAY]: businesshoursForThursdayWithoutValidFromAndValidTill,
		[Weekday.FRIDAY]: businesshoursForFridayWithoutValidFromAndValidTill,
		[Weekday.SATURDAY]: businesshoursForSaturdayWithoutValidFromAndValidTill,
		[Weekday.SUNDAY]: businesshoursForSundayWithoutValidFromAndValidTill,
	}


	let current_time_start_key: any = undefined;
	type groupEntry = {
		wednesdays: Weekday[],
		businesshours: Businesshours[]
	}
	let groups: groupEntry[] = [
		{
			wednesdays: [],
			businesshours: []
		}
	];

	// What we would like to have is:
	// go through our weekdays order
	weekdayOrder.forEach(weekday => {
		// we search for the first weekday every businesshour in the businesshours array
		let businesshoursForWeekday = businesshoursForWeekdays[weekday];

		// we then sort the businesshours by time_start
		let sortedBusinesshours = businesshoursForWeekday?.sort((a, b) => {
			if (a.time_start && b.time_start) {
				return a.time_start.localeCompare(b.time_start);
			}
			return 0;
		});

		// we then create a key consisting of the start and end time of each businesshour for the current weekday
		let time_start_key_for_weekday = sortedBusinesshours?.map(businesshour => {
			return ""+ businesshour?.time_start + businesshour?.time_end;
		}).join("-");
		if(current_time_start_key === undefined) { // save the first key
			current_time_start_key = time_start_key_for_weekday;
		}

		// if we don't find the same key (aka. not all businesshours are same for the current weekday) we will push the current object to the renderedEntries array and create a new object for the current weekday
		if (current_time_start_key === time_start_key_for_weekday) {
			let current_group = groups[groups.length - 1];
			current_group.businesshours = sortedBusinesshours || [];
			let current_group_wednesdays = current_group.wednesdays;
			current_group_wednesdays.push(weekday);
			current_group.wednesdays = current_group_wednesdays;
			// save the current group back to the groups array
			groups[groups.length - 1] = current_group;
		} else {
			current_time_start_key = time_start_key_for_weekday;
			// create a new object for the current weekday
			let new_group: groupEntry = {
				wednesdays: [weekday],
				businesshours: sortedBusinesshours || []
			}
			groups.push(new_group);
		}
	});

	// we then go through the groups array and create a SettingsRowGroup for each group
	groups.forEach(group => {
		let groupBusinesshours = group.businesshours;
		let groupWednesdays = group.wednesdays;
		let renderedBusinesshours: any[] = [];
		groupBusinesshours?.forEach(businesshour => {
			let time_start = businesshour.time_start;
			let time_end = businesshour.time_end;
			if(time_start && time_end) {
				renderedBusinesshours.push(<BusinesshourTableRow key={businesshour.id} translation_until={translation_until} time_start={time_start} time_end={time_end} weekdayStart={groupWednesdays[0]} weekdayEnd={groupWednesdays[groupWednesdays.length - 1]} locale={locale} />)
			}
		});
		//renderedEntries.push(<SettingsRowGroup key={groupWednesdays.join("-")}>{renderedBusinesshours}</SettingsRowGroup>)
		renderedEntries.push(renderedBusinesshours)
	})


	function renderDebug() {
		if(isDebug){
			return <View>
				<Text>{"GROUPS:"}</Text>
				<Text>{JSON.stringify(groups, null, 2)}</Text>
				<Text>{"BUSINESSHOURS:"}</Text>
				<Text>{JSON.stringify(businesshours, null, 2)}</Text>
			</View>
		}
	}


	let renderedNoValue: any = null;
	if(!businesshours || businesshours.length === 0) {
		renderedNoValue = <SettingsRow accessibilityLabel={translation_no_data_found} labelLeft={translation_no_data_found} />
	}

	return (
		<View style={{
			width: '100%',
		}}>
			{renderedEntries}
			{renderedNoValue}
			{renderDebug()}
		</View>
	)
}
