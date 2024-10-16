import React, {FunctionComponent} from 'react';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {BusinesshoursButton} from "@/compositions/businesshours/BusinesshoursButton";
import {
	useSynchedCanteensFoodServicehoursDict,
	useSynchedCanteensFoodServicehoursDuringSemesterBreakDict
} from "@/states/SynchedCanteens";
import {Buildings, Businesshours} from "@/helper/database/databaseTypes/types";
import {useSynchedBuildingsBusinesshours, useSynchedBuildingsDict} from "@/states/SynchedBuildings";

interface AppState {

}
export const BusinesshoursCanteenButton: FunctionComponent<AppState> = ({...props}) => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const canteensFoodserviceHours = useSynchedCanteensFoodServicehoursDict();
	const canteensFoodserviceHoursDuringSemesterBreak = useSynchedCanteensFoodServicehoursDuringSemesterBreakDict();
	const buildingsBusinesshours = useSynchedBuildingsBusinesshours();

	let canteen_id = profileCanteen?.id;
	//console.log("BusinesshoursCanteenButton: canteen_id", canteen_id)
	let building_id = undefined
	if(profileCanteen?.building){
		if(typeof profileCanteen.building === "string") {
			building_id = profileCanteen.building
		} else if (typeof profileCanteen.building === "object") {
			building_id = profileCanteen.building.id
		}
	}
	//console.log("BusinesshoursCanteenButton: building_id", building_id)

	let buildingBusinesshours: Businesshours[] | undefined = buildingsBusinesshours[building_id];
	let canteenFoodServicehours: Businesshours[] | undefined = canteensFoodserviceHours[canteen_id];
	let canteenFoodServicehoursDuringSemesterBreak: Businesshours[] | undefined = canteensFoodserviceHoursDuringSemesterBreak[canteen_id];

	//console.log("BusinesshoursCanteenButton: profileCanteen", profileCanteen);
	//console.log("BusinesshoursCanteenButton: canteensBusinesshours", canteensBusinesshours);
	//console.log("BusinesshoursCanteenButton: buildingBusinesshours", buildingBusinesshours)


	return <BusinesshoursButton businesshours={buildingBusinesshours} foodservicehours={canteenFoodServicehours} foodservicehoursDuringSemesterBreak={canteenFoodServicehoursDuringSemesterBreak} {...props} />
}
