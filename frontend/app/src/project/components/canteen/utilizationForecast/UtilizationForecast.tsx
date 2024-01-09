import React, {FunctionComponent, useEffect, useState} from "react";
import {View, Text} from "native-base";
import {
	useDebugMode,
	useDemoMode, useSynchedCanteensDict,
	useSynchedSettingsFoods,
	useSynchedSettingsUtilizations
} from "../../../helper/synchedJSONState";
import {UtilizationForecastRow} from "./UtilizationForecastRow";
import {DateHelper} from "../../../helper/DateHelper";
import {Directus, Filter} from "@directus/sdk";
import {CustomDirectusTypes} from "../../../directusTypes/types";
import {ServerAPI} from "../../../../kitcheningredients";

export const UtilizationForecast: FunctionComponent = (props) => {

	let paramcanteenId = props?.canteenid;
	let paramDate = props?.date;

	const [synchedCanteensDict, setSynchedCanteensDict] = useSynchedCanteensDict();
	const [utilizationSettings, setUtilizationSettings] = useSynchedSettingsUtilizations();
	const visible = utilizationSettings?.["enabled"]
	const [debug, setDebug] = useDebugMode()
	const [demo, setDemo] = useDemoMode();

	const [utilization, setUtilization] = useState({});

	async function loadUtilizationFromServer(canteen_id, date){
		//console.log("loadUtilizationFromServer")
		//console.log("canteen_id: "+canteen_id);
		//console.log("date: "+date);
		let canteenObj = synchedCanteensDict[canteen_id];
		if(!!canteenObj){
			let utilization_group = canteenObj?.utilization_group;
			//console.log("utilization_group: "+utilization_group);

			let formatedDate = new Date(date);
			let amountDays = 1;
			let dateRanges = DateHelper.getDatesOfAmountNextDaysIncludingToday(formatedDate, amountDays);

			let startRange = dateRanges[0];
			let start = new Date(startRange[0]);

			let endRange = dateRanges[dateRanges.length-1];
			let end = new Date(endRange[1]);

			//console.log("Get all utilizations between:")
			//console.log(start);
			//console.log("and ")
			//console.log(end);

			let dateFilter: Filter<any> = {};
			let andFilters = [];

			andFilters.push(
				{
					date_start: {
						_between: [start.toISOString(), end.toISOString()]
					}
				}
			);
			andFilters.push(
				{
					date_end: {
						_between: [start.toISOString(), end.toISOString()]
					}
				}
			);

			andFilters.push(
				{
					utilization_group: {
						_eq: utilization_group
					}
				}
			);

			dateFilter = {
				_and: andFilters
			}

			let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
			let utilizations_entries_fields = ['*'];

			try{
				let answer = await directus.items("utilizations_entries").readByQuery({
					limit: -1,
					filter: dateFilter,
					fields: utilizations_entries_fields
				});
				let items = answer?.data;
				//console.log(items);
				return items;
			} catch (err){
				console.log("Error at Load Utilization entries");
				//console.log(err);
				return null;
			}

		} else {
			console.log("Canteen not found by canteen id");
		}
	}

	function formatRemoteUtilizationEntries(items){
		//console.log("formatRemoteUtilizationEntries")
		//console.log("items");
		//console.log(items)

		let utilization = {};

		for (let i = 0; i < items.length; i++) {
			let utilization_entry = items[i];
			//console.log("utilization_entry:")
			//console.log(utilization_entry);

			let currentStart = new Date(utilization_entry.date_start);
			//console.log("currentStart: "+currentStart.toISOString())
			let currentEnd = new Date(utilization_entry.date_end);
			//console.log("currentEnd: "+currentEnd.toISOString())

			// TODO Need to know the Max value?
			let traffic = utilization_entry?.value_real || utilization_entry?.value_forecast_current || 0;
			//console.log("traffic: "+traffic)

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

	async function loadUtilization(){
		if(demo){
			let demoUtilization = getDemoUtilization()
			setUtilization(demoUtilization);
		} else {
			// TODO: Implement correct download of forecast data
			if(!!paramcanteenId && !!paramDate){
				let remoteUtilization = await loadUtilizationFromServer(paramcanteenId, paramDate)
				let formattedUtilization = formatRemoteUtilizationEntries(remoteUtilization);
				//console.log("formattedUtilization")
				//console.log(formattedUtilization)
				setUtilization(formattedUtilization);
			} else {
				console.log("UtilizationForecast no canteenId or paramDate given")
			}
		}
	}

	useEffect(() => {
		loadUtilization()
	}, [
		paramcanteenId, paramDate
	])

	function getDemoUtilization() {
		let utilization = {};

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
				<UtilizationForecastRow utilization={utilization} />
			</View>
		)
	}
}
