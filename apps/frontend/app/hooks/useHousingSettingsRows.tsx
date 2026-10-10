import React, { useMemo } from 'react';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { ApartmentSortOption } from 'repo-depkit-common';

import SettingsList from '@/components/SettingsList/SettingsList';
import { SettingsGroupRow } from '@/components/SettingsGroupRows';
import { FreeApartmentsNotificationToggle } from '@/components/FreeApartmentsNotification';
import { getHousingSortOptionLabel } from '@/hooks/useHousingSortingModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';

/**
 * The housing settings as rows, shared by the housing options modal and the settings screen, so
 * both always show the same settings with the same color and values.
 */
const useHousingSettingsRows = ({ onSort, iconSize = 20 }: { onSort: () => void; iconSize?: number }): SettingsGroupRow[] => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const apartmentsSortBy = useAppSelector(state => state.settings.apartmentsSortBy);
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	const housingAreaColor = useAppSelector(state => state.settings.appSettings?.housing_area_color) || primaryColor;

	return useMemo(
		() => [
			{
				key: 'housing-sort',
				render: (groupPosition, showSeparator) => (
					<SettingsList
						iconBgColor={housingAreaColor}
						leftIcon={<MaterialIcons name="sort" size={iconSize} />}
						title={translate(TranslationKeys.sort)}
						value={translate(getHousingSortOptionLabel(apartmentsSortBy as ApartmentSortOption))}
						rightIcon={<Octicons name="chevron-right" size={iconSize} color={theme.screen.icon} />}
						onPress={onSort}
						groupPosition={groupPosition}
						showSeparator={showSeparator}
					/>
				),
			},
			{
				key: 'housing-free-apartments-notification',
				render: groupPosition => <FreeApartmentsNotificationToggle groupPosition={groupPosition} iconSize={iconSize} />,
			},
		],
		[apartmentsSortBy, housingAreaColor, iconSize, onSort, theme.screen.icon, translate]
	);
};

export default useHousingSettingsRows;
