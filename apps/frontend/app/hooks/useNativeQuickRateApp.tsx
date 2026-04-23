import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

import { getValue, setValue } from '@/constants/AsyncStorageHelper';

const ASYNC_STORAGE_KEY_WAS_ASKED_FOR_RATING = 'wasAskedForRating';

/**
 * Hook that wraps native StoreReview logic and tracks whether the user
 * has already been asked for a rating via AsyncStorage.
 *
 * Reusable by both RateAppSettingsItem and the collectible-event
 * congratulations modal.
 */
const useNativeQuickRateApp = () => {
	const [wasAskedForRating, setWasAskedForRating] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getValue(ASYNC_STORAGE_KEY_WAS_ASKED_FOR_RATING)
			.then((value) => {
				if (value === true) {
					setWasAskedForRating(true);
				}
			})
			.catch(() => {})
			.finally(() => setIsLoading(false));
	}, []);

	const requestNativeReview = useCallback(async (): Promise<boolean> => {
		if (Platform.OS === 'web') {
			return false;
		}

		if (wasAskedForRating) {
			return false;
		}

		try {
			const isAvailable = await StoreReview.isAvailableAsync();
			if (isAvailable) {
				await StoreReview.requestReview();
				setWasAskedForRating(true);
				await setValue(ASYNC_STORAGE_KEY_WAS_ASKED_FOR_RATING, true);
				return true;
			}
		} catch (error) {
			console.log('useNativeQuickRateApp: error requesting review', error);
		}

		return false;
	}, [wasAskedForRating]);

	return { wasAskedForRating, isLoading, requestNativeReview };
};

export default useNativeQuickRateApp;
