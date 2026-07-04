import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform, StyleSheet, Text, View } from 'react-native';
import * as StoreReview from 'expo-store-review';

import { getValue, setValue } from '@/constants/AsyncStorageHelper';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { RateAppSettingsItem } from '@/components/RateAppSettingsItem/RateAppSettingsItem';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import useDebugMode from '@/hooks/useDebugMode';

const ASYNC_STORAGE_KEY_APP_RATING_SCORE = 'appRatingScore';
const SCORE_THRESHOLD = 100;

const SCORE_APP_START = 5;
const SCORE_FOODOFFER_DETAILS_OPEN = 10;
const SCORE_FOODOFFER_DETAILS_TAB_SWITCH = 5;
const SCORE_BALANCE_READ = 100;

/**
 * Hook that manages a persistent "App Rating Score".
 * Points accumulate through user interactions. When the score reaches the threshold (100),
 * the app attempts to show the native rating dialog on foodoffer screen focus.
 *
 * Point sources:
 * - +5 on app start (foreground)
 * - +10 when foodoffer details modal is opened
 * - +5 when tab is switched in foodoffer details modal
 *
 * On foodoffer screen focus with score >= threshold:
 * - If native rating request is possible: ask and reset score to 0
 * - If not possible and debug mode: show rating modal
 * - If cooldown or not possible (and not debug): do nothing
 */
const useAppRatingScore = () => {
	const [score, setScore] = useState(0);
	const [loaded, setLoaded] = useState(false);
	const scoreRef = useRef(0);
	const debugMode = useDebugMode();
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();

	// Load persisted score on mount
	useEffect(() => {
		getValue(ASYNC_STORAGE_KEY_APP_RATING_SCORE)
			.then((value) => {
				const loadedScore = typeof value === 'number' ? value : 0;
				setScore(loadedScore);
				scoreRef.current = loadedScore;
			})
			.catch(() => {})
			.finally(() => setLoaded(true));
	}, []);

	const persistScore = useCallback(async (newScore: number) => {
		scoreRef.current = newScore;
		setScore(newScore);
		await setValue(ASYNC_STORAGE_KEY_APP_RATING_SCORE, newScore);
	}, []);

	const addPoints = useCallback(async (points: number) => {
		if (!loaded) return;
		const newScore = scoreRef.current + points;
		await persistScore(newScore);
	}, [loaded, persistScore]);

	const resetScore = useCallback(async () => {
		await persistScore(0);
	}, [persistScore]);

	// +5 points on app start (foreground)
	const appStartHandledRef = useRef(false);
	useEffect(() => {
		if (!loaded) return;
		if (appStartHandledRef.current) return;
		appStartHandledRef.current = true;
		const doAdd = async () => {
			const newScore = scoreRef.current + SCORE_APP_START;
			await persistScore(newScore);
		};
		doAdd();
	}, [loaded, persistScore]);

	// +5 points on app returning to foreground
	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === 'active' && loaded) {
				addPoints(SCORE_APP_START);
			}
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);
		return () => subscription.remove();
	}, [addPoints, loaded]);

	const showDebugRatingModal = useCallback(() => {
		show({
			children: (
				<View style={styles.container}>
					<Text style={[styles.prompt, { color: theme.screen.text }]}>
						{translate(TranslationKeys.collectible_event_rate_app_prompt)}
					</Text>
					<Text style={[styles.debugInfo, { color: theme.screen.text }]}>
						{'[Debug] Rating not available natively - showing modal'}
					</Text>
					<RateAppSettingsItem debug />
				</View>
			),
		});
	}, [show, theme.screen.text, translate]);

	/**
	 * Re-reads the score from AsyncStorage and updates local state.
	 * Useful when other hook instances may have changed the score.
	 */
	const refreshScore = useCallback(async () => {
		const value = await getValue(ASYNC_STORAGE_KEY_APP_RATING_SCORE);
		const freshScore = typeof value === 'number' ? value : 0;
		scoreRef.current = freshScore;
		setScore(freshScore);
		return freshScore;
	}, []);

	/**
	 * Called when the foodoffer screen gains focus.
	 * If score >= threshold, attempt to show rating.
	 * Always reads from AsyncStorage to get the latest cross-instance score.
	 */
	const checkAndRequestRatingOnFocus = useCallback(async () => {
		// Read latest score from AsyncStorage (other hook instances may have changed it)
		const freshScore = await refreshScore();
		if (freshScore < SCORE_THRESHOLD) return;

		if (Platform.OS === 'web') {
			// On web, native rating not available
			if (debugMode) {
				showDebugRatingModal();
			}
			return;
		}

		try {
			const isAvailable = await StoreReview.isAvailableAsync();
			if (isAvailable) {
				await StoreReview.requestReview();
				await resetScore();
				return;
			}
		} catch (error) {
			console.log('useAppRatingScore: error requesting review', error);
		}

		// Not possible to ask natively
		if (debugMode) {
			showDebugRatingModal();
		}
	}, [debugMode, refreshScore, resetScore, showDebugRatingModal]);

	const addPointsForDetailsOpen = useCallback(() => {
		addPoints(SCORE_FOODOFFER_DETAILS_OPEN);
	}, [addPoints]);

	const addPointsForTabSwitch = useCallback(() => {
		addPoints(SCORE_FOODOFFER_DETAILS_TAB_SWITCH);
	}, [addPoints]);

	const addPointsForBalanceRead = useCallback(() => {
		addPoints(SCORE_BALANCE_READ);
	}, [addPoints]);

	return {
		score,
		persistScore,
		refreshScore,
		checkAndRequestRatingOnFocus,
		showDebugRatingModal,
		addPointsForDetailsOpen,
		addPointsForTabSwitch,
		addPointsForBalanceRead,
	};
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
	debugInfo: {
		textAlign: 'center',
		paddingHorizontal: 24,
		fontSize: 12,
		fontStyle: 'italic',
		opacity: 0.7,
	},
});

export default useAppRatingScore;
