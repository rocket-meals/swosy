import React, {FunctionComponent} from 'react';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {BusinesshoursButton} from "@/compositions/businesshours/BusinesshoursButton";
import {useSynchedCanteensBusinesshours, useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {Businesshours} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";

interface AppState {

}
export const BusinesshoursCanteenButton: FunctionComponent<AppState> = ({...props}) => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [canteensDict, setCanteendDict] = useSynchedCanteensDict()
	const canteensBusinesshours = useSynchedCanteensBusinesshours();
	//console.log("canteensBusinesshours", canteensBusinesshours);
	//console.log("canteensDict", canteensDict);
	let canteen_id = profileCanteen?.id;
	if(!canteen_id){
		return null;
	}

	let caneenBusinesshours: Businesshours[] | undefined = canteensBusinesshours[canteen_id];


	return <BusinesshoursButton businesshours={caneenBusinesshours} {...props} />
}
