import React, { useCallback } from 'react';
import { Platform, Text, View } from 'react-native';

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

	const showAppRating = useCallback(() => {
		if (Platform.OS !== 'web') {
			requestNativeReview();
		} else {
			show({
				children: (
					<View style={{ paddingVertical: 24, gap: 12 }}>
						<Text
							style={{
								color: theme.screen.text,
								textAlign: 'center',
								paddingHorizontal: 24,
								fontSize: 16,
								fontFamily: 'Poppins_700Bold',
							}}
						>
							{translate(TranslationKeys.collectible_event_rate_app_prompt)}
						</Text>
						<RateAppSettingsItem />
					</View>
				),
			});
		}
	}, [requestNativeReview, show, theme.screen.text, translate]);

	const checkShouldShowAppRating = useCallback((): boolean => {
		return debugMode === true;
	}, [debugMode]);

	const checkAndShowAppRating = useCallback(() => {
		if (checkShouldShowAppRating()) {
			showAppRating();
		}
	}, [checkShouldShowAppRating, showAppRating]);

	return { checkAndShowAppRating, showAppRating };
};

export default useCheckAppRateAsking;
