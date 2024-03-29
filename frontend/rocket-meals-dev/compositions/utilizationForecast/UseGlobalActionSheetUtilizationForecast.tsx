import {UtilizationsEntries, UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import React, {useEffect, useState} from 'react';
import {UtilizationForecast} from '@/compositions/utilizationForecast/UtilizationForecast';
import {loadUtilizationEntriesRemote} from "@/states/SynchedUtiliztations";
import {useIsDemo} from "@/states/SynchedDemo";


export const UtilizationContent = ({utilizationGroup, selectedDateIsoString}: {utilizationGroup: UtilizationsGroups, selectedDateIsoString: string}) => {
	const [utilizationEntries, setUtilizationEntries] = useState<UtilizationsEntries[] | undefined>(undefined)
	const isDemo = useIsDemo()

	async function updateUtilizationEntries() {
		// and type of utilizationGroup is UtilizationsGroups
		if (utilizationGroup !== null && utilizationGroup !== undefined && typeof utilizationGroup !== 'string') {
			const utilizationEntriesRemote = await loadUtilizationEntriesRemote(utilizationGroup, selectedDateIsoString, isDemo);
			setUtilizationEntries(utilizationEntriesRemote)
		}
	}

	// create a useEffect which updates the utilization entries when the dateAsDependecy changes
	useEffect(() => {
		updateUtilizationEntries()
	}, [utilizationGroup, selectedDateIsoString]);

	if(utilizationEntries === undefined) {
		return null;
	}

	return <UtilizationForecast key={JSON.stringify(utilizationEntries)} utilizationEntires={utilizationEntries} />
}
