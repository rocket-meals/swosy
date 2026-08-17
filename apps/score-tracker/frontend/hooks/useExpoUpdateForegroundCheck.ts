import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { logDebug } from '../helpers/DebugLogger';
import { areExpoUpdatesAvailable } from '../helpers/ExpoUpdatesHelper';

const IS_SMARTPHONE = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Re-checks for an OTA update whenever the app returns to the foreground, and
 * applies it immediately (fetch + reload) if one is available - no prompt, so
 * updates actually reach users instead of sitting unapplied until they happen
 * to force-quit and relaunch. Safe to reload silently: game/friends/theme/
 * debug state is all persisted (see store.ts), so a reload just re-hydrates
 * from disk rather than losing anything.
 */
export function useExpoUpdateForegroundCheck() {
	const appState = useRef<AppStateStatus>(AppState.currentState);

	useEffect(() => {
		if (!IS_SMARTPHONE || !areExpoUpdatesAvailable()) return;

		const subscription = AppState.addEventListener('change', (nextState) => {
			if (appState.current.match(/inactive|background/) && nextState === 'active') {
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
		logDebug('ExpoUpdate: update found on foreground resume, downloading');
		await Updates.fetchUpdateAsync();
		logDebug('ExpoUpdate: downloaded, reloading app');
		await Updates.reloadAsync();
	} catch (e) {
		console.warn('[useExpoUpdateForegroundCheck] Error while checking/applying update:', e);
	}
}
