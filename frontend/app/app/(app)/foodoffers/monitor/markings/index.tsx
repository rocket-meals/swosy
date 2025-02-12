import {ExpoRouter} from "@/.expo/types/router";
import {useLocalSearchParams} from "expo-router";
import {MyTextProps, Text, TEXT_SIZE_2_EXTRA_SMALL, TEXT_SIZE_DEFAULT, View} from "@/components/Themed";
import React, {FunctionComponent, useEffect, useState} from "react";
import {Canteens, Foodoffers, Markings} from "@/helper/database/databaseTypes/types";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {SearchParams} from "@/helper/searchParams/SearchParams";
import {useSortedMarkings, useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {DateHelper} from "@/helper/date/DateHelper";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";
import {MyProgressbar} from "@/components/progressbar/MyProgressbar";
import {getMarkingName} from "@/components/food/MarkingListItem";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MarkingIconClickable, MarkingIconOrShortCodeWithTextSize} from "@/components/food/MarkingBadge";
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {MonitorHeader} from "@/compositions/monitor/MonitorHeader";
import {useRefreshDataIntervalInSecondsFromLocalSearchParams} from "@/app/(app)/foodoffers/monitor/dayplan/details";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import MyPrintComponent, {MyPrintButton, useStablePrintCallback} from "@/components/printComponent/MyPrintComponent";

export const SEARCH_PARAM_NEXT_PAGE_INTERVAL = 'nextPageIntervalInSeconds';
export const SEARCH_PARAM_REFRESH_DATA_INTERVAL = 'refreshDataIntervalInSeconds';

export function getRouteToMarkingsListScreen(refreshDataIntervalInSeconds?: number | null |undefined): ExpoRouter.Href {
	let paramsRaw = []

	let paramForRefreshDataInterval = refreshDataIntervalInSeconds ? SEARCH_PARAM_REFRESH_DATA_INTERVAL+"="+encodeURIComponent(refreshDataIntervalInSeconds) : null;
	if(paramForRefreshDataInterval){
		paramsRaw.push(paramForRefreshDataInterval)
	}

	const fullscreen = true;
	let paramForFullScreen = fullscreen ? SEARCH_PARAM_FULLSCREEN+"="+encodeURIComponent(fullscreen) : null;
	if(paramForFullScreen){
		paramsRaw.push(paramForFullScreen)
	}

	let paramForKioskMode = SearchParams.KIOSK_MODE+"="+encodeURIComponent(true);
	paramsRaw.push(paramForKioskMode)

	let params = paramsRaw.join("&")
	return `/(app)/foodoffers/monitor/markings?${params}` as ExpoRouter.Href;
}

export default function FoodDayPlanScreen() {
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const [printCallback, stableSetPrintCallback] = useStablePrintCallback();

	const [markingsDict, setMarkingsDict, cacheHelperObjMarkings] = useSynchedMarkingsDict()
	let unsortedMarkingList: Markings[] = [];
	if(!!markingsDict){
		let markingKeys = Object.keys(markingsDict);
		for(let i=0; i<markingKeys.length; i++){
			let key = markingKeys[i];
			let marking = markingsDict[key];
			if(marking){
				unsortedMarkingList.push(marking);
			}
		}
	}
	const sortedMarkings = useSortedMarkings(unsortedMarkingList);
	const translation_markings = useTranslation(TranslationKeys.markings)
	const [reloadNumberForData, setReloadNumberForData] = useState(0);

	const foodAreaColor = useFoodsAreaColor();

	const refreshDataIntervalInSeconds = useRefreshDataIntervalInSecondsFromLocalSearchParams() || 5 * 60;

	const [foodOfferDateHumanReadable, setFoodOfferDateHumanReadable] = useState<string | null>(DateHelper.formatOfferDateToReadable(new Date(), true));
	//const timeHumanReadable = DateHelper.useCurrentTimeForDate();


	// Load foodOffers and markings every 5 minutes
	const INTERVAL = refreshDataIntervalInSeconds * 1000;
	useEffect(() => {
		const interval = setInterval(async () => {
			console.log("Reload foodoffers and markings")
			await cacheHelperObjMarkings.updateFromServer();
			const date = new Date();
			setFoodOfferDateHumanReadable(DateHelper.formatOfferDateToReadable(date, true));
			setReloadNumberForData((prev) => prev + 1);
		}, INTERVAL);
		return () => clearInterval(interval);
	}, [refreshDataIntervalInSeconds]);

	let markingsList: Markings[] = [];
	if(markingsDict){
		let markingKeys = Object.keys(markingsDict);
		for(let i=0; i<markingKeys.length; i++){
			let key = markingKeys[i];
			let marking = markingsDict[key];
			if(marking){
				markingsList.push(marking);
			}
		}
	}


	function renderMyGridList({ children, amountColumns, paddingColumns }: { children: JSX.Element[]; amountColumns: number; paddingColumns: number }) {
		const columns = [];

		// Distribute children among columns
		for (let i = 0; i < amountColumns; i++) {
			columns.push([]);
		}

		let amountChildren = children.length;
		// children are sorted by name length, so we want to evenly distribute them
		const amountChildrenPerColumn = Math.ceil(amountChildren / amountColumns);
		// fill children in first column until it is full and then continue with the next column
		let currentColumnIndex = 0;
		for (let i = 0; i < amountChildren; i++) {
			const child = children[i];
			columns[currentColumnIndex].push(child);
			if (columns[currentColumnIndex].length >= amountChildrenPerColumn) {
				currentColumnIndex++;
			}
		}

		// Render each column with appropriate styling
		const renderedColumns = columns.map((column, index) => (
			<View
				key={index}
				style={{
					flexDirection: 'column',
					justifyContent: 'flex-start',
					alignItems: 'flex-start',
					paddingHorizontal: paddingColumns,
					marginBottom: 10, // Add space between rows if needed
					paddingRight: 10,
				}}
			>
				{column}
			</View>
		));

		return (
			<View
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: 'flex-start',
					alignItems: 'flex-start',
					width: '100%',
				}}
			>
				{renderedColumns}
			</View>
		);
	}



	const renderMarking = (marking: Markings, withTranslation: boolean = true) => {
		const withoutExternalIdentifier = true;
		const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);

		let renderedTranslation = null
		if(withTranslation){
			renderedTranslation = <View style={{
				paddingVertical: 1,
				flex: 1,
				justifyContent: "flex-start",
				alignItems: "flex-start",
			}}>
				<Text size={TEXT_SIZE_DEFAULT}>
					{translated_name}
				</Text>
			</View>
		}

		return (
			<View style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "flex-start",
				flex: 1,
				marginVertical: 1,
			}}>
				<View style={{
					paddingRight: 2,
				}}>
					<MarkingIconClickable markingId={marking.id} textSize={TEXT_SIZE_DEFAULT} />
				</View>
				{renderedTranslation}
			</View>
		)
	}

	function renderMarkingsBottom(){
		const renderedMarkings = [];
		for (let i = 0; i < sortedMarkings.length; i++) {
			const marking = sortedMarkings[i];
			renderedMarkings.push(renderMarking(marking, true));
		}

		return <>
			{renderMyGridList({
				children: renderedMarkings,
				amountColumns: 8,
				paddingColumns: 1,
			})}
		</>
	}

	function renderContent(){

		return <View style={{
			width: '100%',
			height: '100%',
		}}>
			<MyPrintComponent fileName={"labelPrint"} printId={"labelPrint"} setPrintCallback={stableSetPrintCallback}>
				<MonitorHeader headerText={translation_markings} dateHumanReadable={foodOfferDateHumanReadable || ""} rightContent={
					<MyPrintButton printCallback={printCallback} />
				} />
				<View style={{
					width: '100%',
					height: 2,
					backgroundColor: foodAreaColor,
				}} />
				<View style={{
					width: '100%',
					padding: 10,
				}}>
					{renderMarkingsBottom()}
				</View>
			</MyPrintComponent>
			<View style={{
				width: '100%',
				height: 2,
			}}>
				<MyProgressbar key={""+reloadNumberForData} duration={refreshDataIntervalInSeconds} color={foodAreaColor} />
			</View>
		</View>
	}

	return <MySafeAreaView>
		<MyScrollView>
				<View style={{
					width: '100%',
					height: '100%',
				}} >
					{renderContent()}
				</View>
		</MyScrollView>

	</MySafeAreaView>
}