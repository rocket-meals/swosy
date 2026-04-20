import React, { useCallback } from 'react';
import { Text, View } from 'react-native';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import useNativeQuickRateApp from '@/hooks/useNativeQuickRateApp';
import { RateAppSettingsItem } from '@/components/RateAppSettingsItem/RateAppSettingsItem';
import DebugView from '@/components/DebugView';
import styles from '@/app/(app)/collectible-event/styles';

const useCollectibleEventCongratulationsModal = () => {
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { wasAskedForRating, requestNativeReview } = useNativeQuickRateApp();

	const openCongratulationsModal = useCallback(() => {
		const wasAskedSnapshot = wasAskedForRating;

		const handleClose = () => {
			if (!wasAskedSnapshot) {
				requestNativeReview();
			}
		};

		show(
			{
				children: (
					<View style={{ padding: 24, gap: 12 }}>
						<Text
							style={{
								...styles.title,
								color: theme.screen.text,
								textAlign: 'center',
							}}
						>
							{translate(TranslationKeys.collectible_event_congratulations_title)}
						</Text>

						<Text
							style={{
								...styles.label,
								color: theme.screen.text,
								textAlign: 'center',
							}}
						>
							{translate(TranslationKeys.collectible_event_rate_app_prompt)}
						</Text>

						<RateAppSettingsItem />

						<DebugView title="Rating Debug">
							<Text style={{ color: theme.inactiveText, fontSize: 13 }}>
								{`Was user asked for rating: ${wasAskedForRating ? 'Yes' : 'No'}`}
							</Text>
						</DebugView>
					</View>
				),
				onClose: handleClose,
			},
			{}
		);
	}, [
		requestNativeReview,
		show,
		theme.inactiveText,
		theme.screen.text,
		translate,
		wasAskedForRating,
	]);

	return { openCongratulationsModal };
};

export default useCollectibleEventCongratulationsModal;
