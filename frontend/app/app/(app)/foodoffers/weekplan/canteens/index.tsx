import {MySafeAreaView} from '@/components/MySafeAreaView';
import {router, useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import React from 'react';
import {Text, View} from "@/components/Themed";
import {ListRenderItemInfo} from "react-native";
import {DateHelper} from "@/helper/date/DateHelper";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {MyButton} from "@/components/buttons/MyButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {setDateForFoodSelection} from "@/states/SynchedFoodOfferStates";
import {getRouteToFoodplanCanteenAndDateIsoStartWeek} from "../canteen_and_date_iso_start_week";

export const SEARCH_PARAM_CANTEENS_ID = 'canteens_id';

export function useCanteensIdFromGlobalSearchParams() {
	const params = useGlobalSearchParams<{ [SEARCH_PARAM_CANTEENS_ID]?: string }>();
	return params[SEARCH_PARAM_CANTEENS_ID];
}


export default function FoodOfferDetails() {
	let canteen_id: string | undefined = useCanteensIdFromGlobalSearchParams();
	const initialAmountColumns = useMyGridListDefaultColumns();
	const translation_week = useTranslation(TranslationKeys.week)
	const translation_current = useTranslation(TranslationKeys.current)

	// the first calendar week starts at the first monday in the year
	// get the first monday in the year
	let tempDate = DateHelper.getFirstMondayOfYear();
	let today = new Date();
	setDateForFoodSelection(tempDate);

	type DataItem = { key: string; date_start_week_iso: string, week_number: number }

	const data: DataItem[] = []

	// iterate oer all weeks of the year
	const AMOUNT_OF_WEEKS_PER_YEAR = 52;
	const AMOUNT_OF_DAYS_PER_WEEK = 7;
	for (let i = 0; i < AMOUNT_OF_WEEKS_PER_YEAR; i++) {
		const week_number = i+1;
		const date = DateHelper.addDays(tempDate, i * AMOUNT_OF_DAYS_PER_WEEK);
		const date_start_week_iso = date.toISOString();
		const key = date_start_week_iso;
		data.push({ key: key, date_start_week_iso: date_start_week_iso, week_number: week_number });
	}

	function renderLinkToWeekPlan(label: string, isActive: boolean, date_start_week_iso_or_current: string | undefined){
		return(
			<MyButton accessibilityLabel={label} text={label} isActive={isActive} onPress={() => {
				let route = getRouteToFoodplanCanteenAndDateIsoStartWeek(canteen_id, date_start_week_iso_or_current);
				router.push(route);
			}} />
		)
	}

	const renderItem = (info: ListRenderItemInfo<DataItem>) => {
		const date_start_week_iso = info.item.date_start_week_iso;
		let dateStartWeekForActiveCheck = new Date(date_start_week_iso);

		// if today is withing 7 day range then it is true
		dateStartWeekForActiveCheck.setHours(0,0,0,0);
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
			{renderLinkToWeekPlan(label, isActive, date_start_week_iso)}
		</View>
	}



	return (
		<MySafeAreaView>
			<View>
				{renderLinkToWeekPlan(translation_current, true, undefined)}
			</View>
			<MyGridFlatList
				data={data}
				renderItem={renderItem}
				amountColumns={initialAmountColumns}
			/>
		</MySafeAreaView>
	);
}