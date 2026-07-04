import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform, StyleSheet, Text, View } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@/redux/hooks';
import { SET_APP_RATING_SCORE } from '@/redux/Types/types';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { RateAppSettingsItem } from '@/components/RateAppSettingsItem/RateAppSettingsItem';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import useDebugMode from '@/hooks/useDebugMode';

const SCORE_THRESHOLD = 100;

const SCORE_APP_START = 5;
const SCORE_FOODOFFER_DETAILS_OPEN = 10;
const SCORE_FOODOFFER_DETAILS_TAB_SWITCH = 5;
const SCORE_BALANCE_READ = 100;

/**
 * Hook that manages a persistent "App Rating Score" via Redux store.
 * Points accumulate through user interactions. When the score reaches the threshold (100),
 * the app attempts to show the native rating dialog on foodoffer screen focus.
 *
 * Point sources:
 * - +5 on app start (foreground)
 * - +10 when foodoffer details modal is opened
 * - +5 when tab is switched in foodoffer details modal
 * - +100 when balance is read
 *
 * On foodoffer screen focus with score >= threshold:
 * - If native rating request is possible: ask and reset score to 0
 * - If not possible and debug mode: show rating modal
 * - If cooldown or not possible (and not debug): do nothing
 */
const useAppRatingScore = () => {
	const dispatch = useDispatch();
	const score = useAppSelector((state) => state.settings.appRatingScore);
	const debugMode = useDebugMode();
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();

	const scoreRef = useRef(score);
	useEffect(() => {
		scoreRef.current = score;
	}, [score]);

	const setScore = useCallback((newScore: number) => {
		dispatch({ type: SET_APP_RATING_SCORE, payload: newScore });
	}, [dispatch]);

	const addPoints = useCallback((points: number) => {
		const newScore = scoreRef.current + points;
		dispatch({ type: SET_APP_RATING_SCORE, payload: newScore });
	}, [dispatch]);

	const resetScore = useCallback(() => {
		dispatch({ type: SET_APP_RATING_SCORE, payload: 0 });
	}, [dispatch]);

	// +5 points on app start (foreground)
	const appStartHandledRef = useRef(false);
	useEffect(() => {
		if (appStartHandledRef.current) return;
		appStartHandledRef.current = true;
		addPoints(SCORE_APP_START);
	}, []);

	// +5 points on app returning to foreground
	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === 'active') {
				addPoints(SCORE_APP_START);
			}
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);
		return () => subscription.remove();
	}, [addPoints]);

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
	 * Called when the foodoffer screen gains focus or a modal closes.
	 * If score >= threshold, attempt to show rating.
	 * In debug mode, always shows the debug rating modal.
	 */
	const checkAndRequestRatingOnFocus = useCallback(async () => {
		const currentScore = scoreRef.current;
		if (currentScore < SCORE_THRESHOLD) return;

		if (debugMode) {
			resetScore();
			showDebugRatingModal();
			return;
		}

		if (Platform.OS === 'web') {
			return;
		}

		try {
			const isAvailable = await StoreReview.isAvailableAsync();
			if (isAvailable) {
				await StoreReview.requestReview();
				resetScore();
				return;
			}
		} catch (error) {
			console.log('useAppRatingScore: error requesting review', error);
		}
	}, [debugMode, resetScore, showDebugRatingModal]);

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
		setScore,
		checkAndRequestRatingOnFocus,
		showDebugRatingModal,
		addPointsForDetailsOpen,
		addPointsForTabSwitch,
		addPointsForBalanceRead,
	};
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 0,
	},
	prompt: {
		textAlign: 'center',
		paddingHorizontal: 24,
		paddingVertical: 12,
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
	debugInfo: {
		textAlign: 'center',
		paddingHorizontal: 24,
		paddingBottom: 8,
		fontSize: 12,
		fontStyle: 'italic',
		opacity: 0.7,
	},
});

export default useAppRatingScore;
