import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { RateAppSettingsItem } from '@/components/RateAppSettingsItem/RateAppSettingsItem';
import { TranslationKeys } from '@/locales/keys';
import useDebugMode from '@/hooks/useDebugMode';
import useNativeQuickRateApp from '@/hooks/useNativeQuickRateApp';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';

const useCheckAppRateAsking = () => {
	const debugMode = useDebugMode();
	const { requestNativeReview } = useNativeQuickRateApp();
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();

	const showWebRatingModal = useCallback(() => {
		show({
			children: (
				<View style={styles.container}>
					<Text style={[styles.prompt, { color: theme.screen.text }]}>
						{translate(TranslationKeys.collectible_event_rate_app_prompt)}
					</Text>
					<RateAppSettingsItem />
				</View>
			),
		});
	}, [show, theme.screen.text, translate]);

	const showAppRating = useCallback(async () => {
		if (Platform.OS !== 'web') {
			const shown = await requestNativeReview();
			if (!shown) {
				showWebRatingModal();
			}
		} else {
			showWebRatingModal();
		}
	}, [requestNativeReview, showWebRatingModal]);

	const checkAndShowAppRating = useCallback(() => {
		if (debugMode) {
			showAppRating();
		}
	}, [debugMode, showAppRating]);

	return { checkAndShowAppRating, showAppRating };
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 24,
		gap: 12,
	},
	prompt: {
		textAlign: 'center',
		paddingHorizontal: 24,
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
});

export default useCheckAppRateAsking;
