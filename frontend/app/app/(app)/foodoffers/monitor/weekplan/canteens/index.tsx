import {MySafeAreaView} from '@/components/MySafeAreaView';
import {router} from 'expo-router';
import React from 'react';
import {View} from "@/components/Themed";
import {ListRenderItemInfo} from "react-native";
import {DateHelper} from "@/helper/date/DateHelper";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {MyButton} from "@/components/buttons/MyButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {formatDateForFoodSelection} from "@/states/SynchedFoodOfferStates";
import {getRouteToFoodplanCanteenAndDateIsoStartWeek} from "../canteen_and_date_iso_start_week";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {getCanteenParam} from "@/app/(app)/foodoffers/monitor/bigscreen/details";
import {ExpoRouter} from "expo-router/types/expo-router";
import {MyPreviousNextButton} from "@/components/buttons/MyPreviousNextButton";
import {IconNames} from "@/constants/IconNames";

export function getRouteToWeekplanCanteen(canteen_id: string){
	let paramsRaw: any[] = []
	let paramForCanteen = getCanteenParam(canteen_id)
	if(paramForCanteen){
		paramsRaw.push(paramForCanteen)
	}
	let params = paramsRaw.join("&")

	return `/foodoffers/monitor/weekplan/canteens/?${params}` as ExpoRouter.Href;
}

export default function FoodOfferDetails() {
	const [canteen, setCanteen] = useSynchedProfileCanteen();
	const initialAmountColumns = useMyGridListDefaultColumns();
	const translation_week = useTranslation(TranslationKeys.week)
	const translation_current = useTranslation(TranslationKeys.current)
	const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());

	const translatedWordYear = useTranslation(TranslationKeys.year);


	// the first calendar week starts at the first monday in the year
	// get the first monday in the year
	let today = new Date();

	type DataItem = { key: string; date_start_week_iso: string, week_number: number }

	const data: DataItem[] = []

	let year = selectedYear;

	let firstCalendarWeekMonday = DateHelper.getFirstCalendarWeek(year);
	let tempDate = new Date(firstCalendarWeekMonday);
	let lastCalendarWeekMonday = DateHelper.getLastCalendarWeek(year);


	// iterate oer all weeks of the year
	let week_number = 1;
	while(tempDate <= lastCalendarWeekMonday){
		let date_start_week_iso = tempDate.toISOString();
		let key = date_start_week_iso;
		data.push({ key: key, date_start_week_iso: date_start_week_iso, week_number: week_number });
		week_number++;
		tempDate = DateHelper.addDays(tempDate, 7);
	}

	function renderLinkToWeekPlan(label: string, isActive: boolean, date_start_week_iso_or_current: string | undefined){
		return(
			<MyButton rightIcon={IconNames.open_link_icon} accessibilityLabel={label} text={label} isActive={isActive} onPress={() => {
				let route = getRouteToFoodplanCanteenAndDateIsoStartWeek(canteen?.id, date_start_week_iso_or_current);
				router.push(route);
			}} />
		)
	}

	const renderItem = (info: ListRenderItemInfo<DataItem>) => {
		const date_start_week_iso = info.item.date_start_week_iso;
		let dateStartWeekForActiveCheck = new Date(date_start_week_iso);
		dateStartWeekForActiveCheck.setHours(0,0,0,0);

		// if today is withing 7 day range then it is true
		let dateNextWeekForActiveCheck = DateHelper.addDays(new Date(dateStartWeekForActiveCheck), 7);
		let isActive = DateHelper.isDateBetween(dateStartWeekForActiveCheck, today, dateNextWeekForActiveCheck);

		let dateStartWeekForPrint = new Date(date_start_week_iso);
		let startWeekPrint = DateHelper.formatOfferDateToReadable(dateStartWeekForPrint, false, false);
		let dateEndWeekForPrint =  DateHelper.addDays(new Date(dateStartWeekForPrint), 6);
		let endWeekPrint = DateHelper.formatOfferDateToReadable(dateEndWeekForPrint, false, false);
		let weekSpanLabel = "("+startWeekPrint+"-"+endWeekPrint+")"


		const week_number = info.item.week_number;
		const label = translation_week+" "+week_number+" "+weekSpanLabel

		return <View key={info.item.key}>
			{renderLinkToWeekPlan(label, isActive, dateStartWeekForActiveCheck.toISOString())}
		</View>
	}

	function renderYearSwitch(){
		return(
			<View style={{
				width: "100%",
				flexDirection: 'row',
				justifyContent: 'center',
			}}>
				<View style={{
					justifyContent: 'center',
					alignItems: 'center',
				}}
				>
						<MyPreviousNextButton translation={translatedWordYear}
											  text={""+(selectedYear-1)}
											  forward={false}
											  onPress={() => {
												  setSelectedYear(selectedYear - 1);
											  }}
						/>
				</View>
				<View>
					<MyButton useOnlyNecessarySpace={true} accessibilityLabel={selectedYear+""} text={selectedYear+""} isActive={true} />
				</View>
				<View style={{
					justifyContent: 'center',
					alignItems: 'center',
				}}>
						<MyPreviousNextButton translation={translatedWordYear}
											  text={""+(selectedYear+1)}
											  forward={true}
											  onPress={() => {
												  setSelectedYear(selectedYear + 1);
											  }}
						/>
				</View>
			</View>
		)
	}


	return (
		<MySafeAreaView>
			<View>
				{renderLinkToWeekPlan("Immer Aktuelle Woche", true, undefined)}
			</View>
			<View style={{
				width: "100%",
			}}>
				{renderYearSwitch()}
			</View>
			<MyGridFlatList
				data={data}
				renderItem={renderItem}
				amountColumns={initialAmountColumns}
			/>
		</MySafeAreaView>
	);
}