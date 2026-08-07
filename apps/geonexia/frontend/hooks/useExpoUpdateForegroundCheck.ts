import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { isRecordingActive } from '../helpers/RecordingActivityTracker';

const IS_SMARTPHONE = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Re-checks for an OTA update whenever the app returns to the foreground, and
 * applies it immediately (fetch + reload) if one is available - no prompt, so
 * updates actually reach users instead of sitting unapplied until they happen
 * to force-quit and relaunch. Mirrors the score-tracker hook. All app state
 * (activities, hex tiles, settings, …) is persisted, so a reload just
 * re-hydrates from disk rather than losing anything.
 *
 * Exception: while an activity recording is running the check is skipped
 * entirely — reloading the JS bundle would abort the run (users background
 * the app constantly mid-run). The update is picked up on the next app start
 * by ExpoUpdateLoader instead.
 */
export function useExpoUpdateForegroundCheck() {
	const appState = useRef<AppStateStatus>(AppState.currentState);

	useEffect(() => {
		if (!IS_SMARTPHONE) return;

		const subscription = AppState.addEventListener('change', (nextState) => {
			if (appState.current.match(/inactive|background/) && nextState === 'active' && !isRecordingActive()) {
				checkAndApplyUpdate();
			}
			appState.current = nextState;
		});

		return () => subscription.remove();
	}, []);
}

async function checkAndApplyUpdate() {
	try {
		const update = await Updates.checkForUpdateAsync();
		if (!update.isAvailable) return;
		console.log('[useExpoUpdateForegroundCheck] Update found on foreground resume, downloading');
		await Updates.fetchUpdateAsync();
		// Re-check: a recording may have been started while downloading.
		if (isRecordingActive()) return;
		console.log('[useExpoUpdateForegroundCheck] Downloaded, reloading app');
		await Updates.reloadAsync();
	} catch (e) {
		console.warn('[useExpoUpdateForegroundCheck] Error while checking/applying update:', e);
	}
}
