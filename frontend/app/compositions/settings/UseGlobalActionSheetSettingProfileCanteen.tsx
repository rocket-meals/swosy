import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {Canteens} from '@/helper/database/databaseTypes/types';
import React from 'react';
import {CanteenSelectGridList} from '@/compositions/resourceGridList/canteenSelectGridList';
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {useSynchedProfileCanteen} from "@/states/SynchedProfile";

export interface CanteenSelectionModalProps {
	onSelectCanteen: (canteen: Canteens | null) => void;
	showArchived?: boolean;
}

export const useShowCanteenSelectionModal = (props: CanteenSelectionModalProps) => {
	const translation_title = useTranslation(TranslationKeys.canteen)
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const onPress = () => {
		setModalConfig({
			title: translation_title,
			accessibilityLabel: translation_title,
			label: translation_title,
			key: 'canteenSelect',
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return(
					<CanteenSelectGridList showArchived={props.showArchived} onPress={(canteen: Canteens | undefined) => {
						if(canteen){
							props.onSelectCanteen(canteen);
						} else {
							props.onSelectCanteen(null)
						}
						hide();
					}} />
				)
			}
		})
	}

	return onPress
}


export const useShowMyCanteenSelectionModal = () => {
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const onSelectCanteen = (canteen: Canteens | null) => {
		setProfileCanteen(canteen);
	}

	const onPress = useShowCanteenSelectionModal({onSelectCanteen: onSelectCanteen})

	return onPress
}
