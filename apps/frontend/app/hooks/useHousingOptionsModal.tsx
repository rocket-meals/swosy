import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import SettingsGroupRows from '@/components/SettingsGroupRows';
import useHousingSettingsRows from '@/hooks/useHousingSettingsRows';
import useHousingSortingModal from '@/hooks/useHousingSortingModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const HousingOptionsContent: React.FC<{ onSort: () => void }> = ({ onSort }) => {
	const rows = useHousingSettingsRows({ onSort });

	return (
		<View style={styles.container}>
			<SettingsGroupRows rows={rows} />
		</View>
	);
};

/** "More options" of the housing screen (like the food offers): the same housing settings as in the settings screen. */
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
