import React, { useCallback } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';

import SettingsList from '@/components/SettingsList/SettingsList';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';

type RateAppSettingsItemProps = {
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	showSeparator?: boolean;
	onLog?: (message: string) => void;
};

export const RateAppSettingsItem: React.FC<RateAppSettingsItemProps> = ({ groupPosition = 'single', showSeparator = false, onLog }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();

	const handleRate = useCallback(async () => {
		try {
			onLog?.('Checking availability');
			const available = await StoreReview.isAvailableAsync();
			onLog?.(`Available: ${available}`);

			if (available) {
				await StoreReview.requestReview();
				onLog?.('Review requested');
			}
		} catch (error: any) {
			onLog?.(`Error: ${error?.message || error}`);
			console.log('Error requesting review', error);
		}
	}, [onLog]);

	return (
		<SettingsList
			label={translate(TranslationKeys.rate_app)}
			handleFunction={handleRate}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			noIconIndent
			rightIcon={<MaterialIcons name="star" size={22} color={theme.screen.icon} />}
		/>
	);
};
