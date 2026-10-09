import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import { ApartmentSortOption } from 'repo-depkit-common';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import SettingsListSelectOption from '@/components/SettingsListSelectOption/SettingsListSelectOption';
import { SET_APARTMENTS_SORTING } from '@/redux/Types/types';

const HOUSING_SORT_OPTIONS: { id: ApartmentSortOption; label: TranslationKeys; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
	{ id: ApartmentSortOption.INTELLIGENT, label: TranslationKeys.sort_option_intelligent, icon: 'brain' },
	{ id: ApartmentSortOption.FREE_ROOMS, label: TranslationKeys.free_rooms, icon: 'door-open' },
	{ id: ApartmentSortOption.DISTANCE, label: TranslationKeys.sort_option_distance, icon: 'map-marker-distance' },
	{ id: ApartmentSortOption.LAST_OPENED, label: TranslationKeys.sort_option_last_opened, icon: 'clock-outline' },
	{ id: ApartmentSortOption.ALPHABETICAL, label: TranslationKeys.sort_option_alphabetical, icon: 'sort-alphabetical-ascending' },
	{ id: ApartmentSortOption.NONE, label: TranslationKeys.sort_option_none, icon: 'sort-variant-remove' },
];

/** Translation key of the label for a housing sort option, e.g. to show the current choice. */
export const getHousingSortOptionLabel = (option: ApartmentSortOption | null | undefined): TranslationKeys =>
	HOUSING_SORT_OPTIONS.find(sortOption => sortOption.id === option)?.label ?? TranslationKeys.sort_option_none;

const HousingSortSheet: React.FC<{ closeSheet: () => void }> = ({ closeSheet }) => {
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const { apartmentsSortBy, primaryColor: projectColor, appSettings } = useAppSelector((state) => state.settings);
	const [selectedOption, setSelectedOption] = useState<ApartmentSortOption | null>(null);
	const housing_area_color = appSettings?.housing_area_color ? appSettings?.housing_area_color : projectColor;

	const updateSort = (option: { id: ApartmentSortOption }) => {
		setSelectedOption(option.id);
		dispatch({ type: SET_APARTMENTS_SORTING, payload: option.id });
		closeSheet();
	};

	useEffect(() => {
		setSelectedOption(apartmentsSortBy as ApartmentSortOption);
	}, [apartmentsSortBy]);

	return (
		<View style={{ width: '100%' }}>
			<SettingsListSelectOption
				options={HOUSING_SORT_OPTIONS.map((option) => ({
					id: option.id,
					label: translate(option.label),
					icon: <MaterialCommunityIcons name={option.icon} size={24} />,
				}))}
				selectedOption={selectedOption}
				onSelect={updateSort}
				iconBgColor={housing_area_color}
			/>
		</View>
	);
};

export const useHousingSortingModal = () => {
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const openHousingSortingModal = useCallback(() => {
		showScrollViewModal({
			title: translate(TranslationKeys.sort),
			onClose: closeScrollViewModal,
			children: <HousingSortSheet closeSheet={closeScrollViewModal} />,
		});
	}, [closeScrollViewModal, showScrollViewModal, translate]);

	return { openHousingSortingModal };
};

export default useHousingSortingModal;
