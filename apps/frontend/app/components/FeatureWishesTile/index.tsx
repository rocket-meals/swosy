import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { FeatureWishHelper } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import { useFeatureWishesModal } from '@/components/FeatureWishes/useFeatureWishesModal';
import { useFeatureWishesMode } from '@/hooks/useFeatureWishesMode';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { TranslationKeys } from '@/locales/keys';

/**
 * "Which feature are you missing?" between the first and the second day of the food offers. Hidden
 * when the app settings do not allow submitting wishes, and for 30 days after it was hidden with the
 * former "Hide" button.
 */
const FeatureWishesTile: React.FC = () => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector(state => state.settings);
	const mode = useFeatureWishesMode();
	const tileHiddenAt = useAppSelector(state => state.settings.featureWishesLocal?.tileHiddenAt ?? null);
	const { openFeatureWishesModal } = useFeatureWishesModal();

	if (!FeatureWishHelper.maySubmit(mode) || FeatureWishHelper.isTileHidden(tileHiddenAt, new Date())) {
		return null;
	}

	return (
		<View style={styles.container}>
			<SettingsList
				iconBgColor={primaryColor}
				leftIcon={<MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={theme.screen.icon} />}
				label={translate(TranslationKeys.feature_wishes_tile_title)}
				rightIcon={<Octicons name="chevron-right" size={24} color={theme.screen.icon} />}
				handleFunction={openFeatureWishesModal}
				groupPosition="single"
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		marginVertical: 12,
	},
});

export default FeatureWishesTile;
