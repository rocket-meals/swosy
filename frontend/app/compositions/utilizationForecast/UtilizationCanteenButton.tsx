import React, {FunctionComponent} from 'react';
import {UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {UtilizationButton} from "@/compositions/utilizationForecast/UtilizationButton";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {ItemStatus} from "@/helper/database/ItemStatus";

interface AppState {

}
export const UtilizationCanteenButton: FunctionComponent<AppState> = ({...props}) => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [appSettings, setAppSettings] = useSynchedAppSettings();

	if(!profileCanteen){
		return null;
	}

	const utilizationGroup: UtilizationsGroups | undefined = profileCanteen?.utilization_group as UtilizationsGroups | undefined;
	if(!utilizationGroup){
		return null;
	}

	const utilizationEnabled = appSettings?.utilization_display_enabled;
	if(!utilizationEnabled){
		return null;
	}

	if(utilizationGroup === undefined){
		return null;
	}

	if(utilizationGroup.status !== ItemStatus.PUBLISHED){
		return null;
	}


	return <UtilizationButton utilizationGroup={utilizationGroup} {...props} />
}
