import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import { useMyGlobalActionSheet} from '@/components/actionsheet/MyGlobalActionSheet';
import {UtilizationsEntries, UtilizationsGroups} from '@/helper/database/databaseTypes/types';
import React, {useEffect, useState} from 'react';
import {UtilizationForecast} from '@/compositions/utilizationForecast/UtilizationForecast';
import {useTranslationUtilizationForecast} from "@/compositions/utilizationForecast/UtilizationButton";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {loadUtilizationEntriesRemote} from "@/states/SynchedUtiliztations";
import {useIsDemo} from "@/states/SynchedDemo";


export const UtilizationContent = ({utilizationGroup, selectedDateIsoString}: {utilizationGroup: UtilizationsGroups, selectedDateIsoString: string}) => {
	const [utilizationEntries, setUtilizationEntries] = useState<UtilizationsEntries[] | undefined>(undefined)
	const isDemo = useIsDemo()

	async function updateUtilizationEntries() {
		// and type of utilizationGroup is UtilizationsGroups
		if (utilizationGroup !== null && utilizationGroup !== undefined && typeof utilizationGroup !== 'string') {
			const utilizationEntriesRemote = await loadUtilizationEntriesRemote(utilizationGroup, new Date(selectedDateIsoString), isDemo);
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


export function useGlobalActionSheetUtilizationForecast(utilizationGroup: UtilizationsGroups, selectedDateIsoString: string) {
	const translation_title = useTranslationUtilizationForecast();

	const config = {
		onCancel: async () => {
			return true;
		},
		visible: true,
		title: translation_title,
		renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
			return <MySafeAreaView>
				<MyScrollView>
					<UtilizationContent utilizationGroup={utilizationGroup} selectedDateIsoString={selectedDateIsoString} />
				</MyScrollView>
			</MySafeAreaView>
		}
	}

	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

	const onPress = () => {
		show(config)
	}

	return onPress;
}
