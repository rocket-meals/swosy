import React, {FunctionComponent} from 'react';
import {UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {UtilizationButton} from "@/compositions/utilizationForecast/UtilizationButton";

interface AppState {

}
export const UtilizationCanteenButton: FunctionComponent<AppState> = ({...props}) => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	
	if(!profileCanteen){
		return null;
	}

	const utilizationGroup: string | UtilizationsGroups | null | undefined = profileCanteen?.utilization_group;

	return <UtilizationButton utilizationGroup={utilizationGroup} {...props} />
}
