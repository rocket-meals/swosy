import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import SettingsList from '@/components/SettingsList/SettingsList';
import { FreeApartmentsNotificationToggle } from '@/components/FreeApartmentsNotification';
import useHousingSortingModal from '@/hooks/useHousingSortingModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const HousingOptionsContent: React.FC<{ onSort: () => void }> = ({ onSort }) => {
	const { translate } = useLanguage();

	return (
		<View style={styles.container}>
			<SettingsList title={translate(TranslationKeys.sort)} leftIcon={<MaterialIcons name="sort" size={20} />} onPress={onSort} groupPosition="top" showSeparator={true} />
			<FreeApartmentsNotificationToggle groupPosition="bottom" />
		</View>
	);
};

/** "More options" of the housing screen (like the food offers): sorting and the notification about free apartments. */
const useHousingOptionsModal = () => {
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { openHousingSortingModal } = useHousingSortingModal();

	const openHousingOptionsModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.options_and_information),
			children: <HousingOptionsContent onSort={openHousingSortingModal} />,
		});
	}, [openHousingSortingModal, show, translate]);

	return { openHousingOptionsModal };
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
});

export default useHousingOptionsModal;
