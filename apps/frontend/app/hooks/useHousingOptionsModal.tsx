import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import SettingsGroupRows, { SettingsGroupRow } from '@/components/SettingsGroupRows';
import SettingsList from '@/components/SettingsList/SettingsList';
import useHousingSettingsRows from '@/hooks/useHousingSettingsRows';
import useHousingSortingModal from '@/hooks/useHousingSortingModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';

const HousingOptionsContent: React.FC<{ onSort: () => void; onSettings: () => void }> = ({ onSort, onSettings }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	const housingAreaColor = useAppSelector(state => state.settings.appSettings?.housing_area_color) || primaryColor;
	const housingRows = useHousingSettingsRows({ onSort });

	const rows = useMemo<SettingsGroupRow[]>(
		() => [
			...housingRows,
			{
				key: 'settings',
				render: (groupPosition, showSeparator) => <SettingsList iconBgColor={housingAreaColor} leftIcon={<MaterialCommunityIcons name="cog-outline" size={20} />} title={translate(TranslationKeys.further_settings)} rightIcon={<Octicons name="chevron-right" size={20} color={theme.screen.icon} />} onPress={onSettings} groupPosition={groupPosition} showSeparator={showSeparator} />,
			},
		],
		[housingAreaColor, housingRows, onSettings, theme.screen.icon, translate]
	);

	return (
		<View style={styles.container}>
			<SettingsGroupRows rows={rows} />
		</View>
	);
};

/** "More options" of the housing screen (like the food offers): the same housing settings as in the settings screen, plus a link to all settings. */
const useHousingOptionsModal = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { openHousingSortingModal } = useHousingSortingModal();

	const openSettings = useCallback(() => {
		close();
		router.navigate('/settings');
	}, [close]);

	const openHousingOptionsModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.options_and_information),
			children: <HousingOptionsContent onSort={openHousingSortingModal} onSettings={openSettings} />,
		});
	}, [openHousingSortingModal, openSettings, show, translate]);

	return { openHousingOptionsModal };
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
});

export default useHousingOptionsModal;
