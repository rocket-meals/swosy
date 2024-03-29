import React, {FunctionComponent} from 'react';


import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SortType, useSynchedSortType} from "@/states/SynchedSortType";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";


interface AppState {
	synchKey: string
	itemToSort: string
	availableSortTypes?: SortType[]
}
export const SettingsButtonSort: FunctionComponent<AppState> = ({...props}) => {

	const [selectedSortType, setSelectedSortType] = useSynchedSortType(props.synchKey);

	const translation_title = useTranslation(TranslationKeys.sort)
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const translation_select = useTranslation(TranslationKeys.select)

	const translation_sort_option_none = useTranslation(TranslationKeys.sort_option_none)
	const translation_sort_option_alphabetical = useTranslation(TranslationKeys.sort_option_alphabetical)
	const translation_sort_option_favorite = useTranslation(TranslationKeys.sort_option_favorite)
	const translation_sort_option_intelligent = useTranslation(TranslationKeys.sort_option_intelligent)
	const translation_sort_option_distance = useTranslation(TranslationKeys.sort_option_distance)
	const translation_sort_option_free_rooms = useTranslation(TranslationKeys.free_rooms)

	const translation_sort_eating_habits = useTranslation(TranslationKeys.eating_habits)

	const tooltip = translation_title+": "+props.itemToSort
	const accessibilityLabel = translation_title+": "+props.itemToSort

	const items: MyModalActionSheetItem[] = [];
	const availableSortTypes = props.availableSortTypes;
	const usedSortOptions = availableSortTypes ? availableSortTypes : [SortType.intelligent, SortType.alphabetical, SortType.favorite ,SortType.none, ];
	for(const sortType of usedSortOptions){
		let label = '';
		let icon = '';
		let key = '';
		let active = selectedSortType === sortType;

		if(sortType === SortType.none){
			label = translation_sort_option_none;
			icon = IconNames.sort_none_icon;
			key = 'sortOptionNone';
		} else if(sortType === SortType.alphabetical){
			label = translation_sort_option_alphabetical;
			icon = IconNames.sort_alphabetical_icon
			key = 'sortOptionAlphabetical';
		} else if(sortType === SortType.favorite){
			label = translation_sort_option_favorite;
			icon = IconNames.sort_favorite_icon;
			key = 'sortOptionFavorite';
		} else if(sortType === SortType.intelligent){
			label = translation_sort_option_intelligent;
			icon = IconNames.sort_intelligent_icon;
			key = 'sortOptionIntelligent';
		} else if(sortType === SortType.eatingHabits){
			label = translation_sort_eating_habits;
			icon = IconNames.eating_habit_icon;
			key = 'sortOptionEatingHabits';
		} else if(sortType === SortType.distance){
			label = translation_sort_option_distance;
			icon = IconNames.sort_distance_icon;
			key = 'sortOptionDistance';
		} else if(sortType === SortType.freeRooms){
			label = translation_sort_option_free_rooms;
			icon = IconNames.sort_free_rooms_icon;
			key = 'sortOptionFreeRooms';
		}
		items.push({
			key: key,
			label: label,
			active: active,
			iconLeft: icon,
			accessibilityLabel: label,
			onSelect: async (key: string, hide: () => void) => {
				setSelectedSortType(sortType);
				hide();
			}
		})
	}

	const onPress = () => {
		setModalConfig({
			key: "sort",
			label: translation_title,
			accessibilityLabel: translation_title,
			items: items
		})

	}

	return (
		<>
			<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.sort_icon} {...props} onPress={onPress} />
		</>

	)
}
