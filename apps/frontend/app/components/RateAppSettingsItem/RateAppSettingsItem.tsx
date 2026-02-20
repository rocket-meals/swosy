import React, { useCallback, useEffect, useState } from 'react';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

import SettingsList from '@/components/SettingsList/SettingsList';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';

const RATED_APP_STORAGE_KEY = 'rate_app_review_completed';
const RATE_APP_ICON_BACKGROUND = '#F7D21F';

type RateAppSettingsItemProps = {
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	showSeparator?: boolean;
	onLog?: (message: string) => void;
};

export const RateAppSettingsItem: React.FC<RateAppSettingsItemProps> = ({ groupPosition = 'single', showSeparator = false, onLog }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const { primaryColor } = useSelector((state: RootState) => state.settings);
	const [alreadyRated, setAlreadyRated] = useState(false);

	useEffect(() => {
		const loadRatedState = async () => {
			try {
				const storedRatedState = await AsyncStorage.getItem(RATED_APP_STORAGE_KEY);
				setAlreadyRated(storedRatedState === 'true');
				onLog?.(`Already rated: ${storedRatedState === 'true'}`);
			} catch (error: any) {
				onLog?.(`Read error: ${error?.message || error}`);
			}
		};

		loadRatedState();
	}, [onLog]);

	const handleRate = useCallback(async () => {
		if (alreadyRated) {
			return;
		}

		try {
			onLog?.('Checking availability');
			const available = await StoreReview.isAvailableAsync();
			onLog?.(`Available: ${available}`);

			if (available) {
				await StoreReview.requestReview();
				await AsyncStorage.setItem(RATED_APP_STORAGE_KEY, 'true');
				setAlreadyRated(true);
				onLog?.('Review requested');
			}
		} catch (error: any) {
			onLog?.(`Error: ${error?.message || error}`);
			console.log('Error requesting review', error);
		}
	}, [alreadyRated, onLog]);

	return (
		<SettingsList
			label={translate(TranslationKeys.rate_app)}
			handleFunction={alreadyRated ? undefined : handleRate}
			groupPosition={groupPosition}
			showSeparator={showSeparator}
			iconBgColor={RATE_APP_ICON_BACKGROUND}
			leftIcon={<MaterialIcons name="star" size={22} color={primaryColor} />}
			value={alreadyRated ? 'Dankeschön' : undefined}
			rightIcon={alreadyRated ? undefined : <Octicons name="chevron-right" size={24} color={theme.screen.icon} />}
		/>
	);
};
