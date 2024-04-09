import React, {FunctionComponent} from 'react';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {BusinesshoursButton} from "@/compositions/businesshours/BusinesshoursButton";
import {useSynchedCanteensFoodServicehours, useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {Businesshours} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {useSynchedBuildingsBusinesshours} from "@/states/SynchedBuildings";

interface AppState {

}
export const BusinesshoursCanteenButton: FunctionComponent<AppState> = ({...props}) => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [canteensDict, setCanteendDict] = useSynchedCanteensDict()
	const canteensBusinesshours = useSynchedCanteensFoodServicehours();
	const buildingsBusinesshours = useSynchedBuildingsBusinesshours();
	//console.log("canteensBusinesshours", canteensBusinesshours);
	//console.log("canteensDict", canteensDict);
	let canteen_id = profileCanteen?.id;
	let building_id = undefined
	if(profileCanteen?.building){
		if(typeof profileCanteen.building === "string") {
			building_id = profileCanteen.building
		} else if (typeof profileCanteen.building === "object") {
			building_id = profileCanteen.building.id
		}
	}


	let buildingBusinesshours: Businesshours[] | undefined = buildingsBusinesshours[building_id];
	let canteenFoodServicehours: Businesshours[] | undefined = canteensBusinesshours[canteen_id];


	return <BusinesshoursButton businesshours={buildingBusinesshours} foodservicehours={canteenFoodServicehours} {...props} />
}
