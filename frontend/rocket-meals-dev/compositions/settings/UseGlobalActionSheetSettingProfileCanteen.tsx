import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {Canteens} from '@/helper/database/databaseTypes/types';
import React from 'react';
import {CanteenSelectGridList} from '@/compositions/resourceGridList/canteenSelectGridList';
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";

export const useShowMyCanteenSelectionModal = () => {
	const translation_title = useTranslation(TranslationKeys.canteen)
	const [modalConfig, setModalConfig] = useModalGlobalContext();
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();

	const onPress = () => {
		setModalConfig({
			title: translation_title,
			accessibilityLabel: translation_title,
			label: translation_title,
			key: 'canteenSelect',
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return(
					<CanteenSelectGridList onPress={(canteen: Canteens | undefined) => {
						if(canteen){
							setProfileCanteen(canteen);
						} else {
							setProfileCanteen(null)
						}
						hide();
					}} />
				)
			}
		})
	}

	return onPress
}
