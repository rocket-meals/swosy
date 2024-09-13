import React, {FunctionComponent} from 'react';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {BusinesshoursButton} from "@/compositions/businesshours/BusinesshoursButton";
import {useSynchedCanteensFoodServicehoursDict} from "@/states/SynchedCanteens";
import {Buildings, Businesshours} from "@/helper/database/databaseTypes/types";
import {useSynchedBuildingsBusinesshours, useSynchedBuildingsDict} from "@/states/SynchedBuildings";

interface AppState {

}
export const BusinesshoursCanteenButton: FunctionComponent<AppState> = ({...props}) => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const canteensBusinesshours = useSynchedCanteensFoodServicehoursDict();
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
	let canteenFoodServicehours: Businesshours[] | undefined = canteensBusinesshours[canteen_id];

	const noBuildingBusinesshours = buildingBusinesshours === undefined || buildingBusinesshours.length === 0;
	const noCanteenFoodServicehours = canteenFoodServicehours === undefined || canteenFoodServicehours.length === 0;

	//console.log("BusinesshoursCanteenButton: profileCanteen", profileCanteen);
	//console.log("BusinesshoursCanteenButton: canteensBusinesshours", canteensBusinesshours);
	//console.log("BusinesshoursCanteenButton: buildingBusinesshours", buildingBusinesshours)


	return <BusinesshoursButton businesshours={buildingBusinesshours} foodservicehours={canteenFoodServicehours} {...props} />
}
