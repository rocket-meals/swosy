import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { CampusSortOption } from 'repo-depkit-common';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import SettingsList from '@/components/SettingsList/SettingsList';
import useCampusSortingModal from '@/hooks/useCampusSortingModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';

const CAMPUS_SORT_OPTION_LABELS: Record<CampusSortOption, TranslationKeys> = {
	[CampusSortOption.INTELLIGENT]: TranslationKeys.sort_option_intelligent,
	[CampusSortOption.DISTANCE]: TranslationKeys.sort_option_distance,
	[CampusSortOption.LAST_OPENED]: TranslationKeys.sort_option_last_opened,
	[CampusSortOption.ALPHABETICAL]: TranslationKeys.sort_option_alphabetical,
	[CampusSortOption.NONE]: TranslationKeys.sort_option_none,
};

const CampusSettingsContent: React.FC<{ onSort: () => void }> = ({ onSort }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const campusesSortBy = useAppSelector(state => state.settings.campusesSortBy);
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	const campusAreaColor = useAppSelector(state => state.settings.appSettings?.campus_area_color) || primaryColor;

	return (
		<View style={styles.container}>
			<SettingsList
				iconBgColor={campusAreaColor}
				leftIcon={<MaterialIcons name="sort" size={20} />}
				title={translate(TranslationKeys.sort)}
				value={translate(CAMPUS_SORT_OPTION_LABELS[campusesSortBy as CampusSortOption] ?? TranslationKeys.sort_option_none)}
				rightIcon={<Octicons name="chevron-right" size={20} color={theme.screen.icon} />}
				onPress={onSort}
				groupPosition="single"
			/>
		</View>
	);
};

/** Opens the campus settings in a modal, used by the settings screen. */
const useCampusSettingsModal = () => {
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { openCampusSortingModal } = useCampusSortingModal();

	const openCampusSettingsModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.campus_settings),
			children: <CampusSettingsContent onSort={openCampusSortingModal} />,
		});
	}, [openCampusSortingModal, show, translate]);

	return { openCampusSettingsModal };
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
});

export default useCampusSettingsModal;
