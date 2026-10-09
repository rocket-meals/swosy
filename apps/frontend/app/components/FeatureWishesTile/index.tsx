import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { FeatureWishHelper } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import { useFeatureWishesModal } from '@/components/FeatureWishes/useFeatureWishesModal';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { SET_FEATURE_WISHES_LOCAL_DATA } from '@/redux/Types/types';
import { TranslationKeys } from '@/locales/keys';

/**
 * "Which feature are you missing?" between the first and the second day of the food offers. Hidden
 * when feature wishes are switched off in the app settings, and for 30 days after "Hide".
 */
const FeatureWishesTile: React.FC = () => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useAppDispatch();
	const { primaryColor, appSettings } = useAppSelector(state => state.settings);
	const tileHiddenAt = useAppSelector(state => state.settings.featureWishesLocal?.tileHiddenAt ?? null);
	const { openFeatureWishesModal } = useFeatureWishesModal();

	const hide = useCallback(() => {
		dispatch({ type: SET_FEATURE_WISHES_LOCAL_DATA, payload: { tileHiddenAt: new Date().toISOString() } });
	}, [dispatch]);

	if (appSettings?.feature_wishes_enabled !== true || FeatureWishHelper.isTileHidden(tileHiddenAt, new Date())) {
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
			<TouchableOpacity style={[styles.hideButton, { borderColor: theme.screen.placeholder }]} onPress={hide} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.hide)}>
				<Text style={[styles.hideText, { color: theme.screen.text }]}>{translate(TranslationKeys.hide)}</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		marginVertical: 12,
		gap: 8,
	},
	hideButton: {
		alignSelf: 'flex-start',
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 4,
		marginLeft: 4,
	},
	hideText: {
		fontSize: 13,
	},
});

export default FeatureWishesTile;
