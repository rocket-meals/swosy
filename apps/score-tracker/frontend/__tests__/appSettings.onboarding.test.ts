// The storage helper only needs the storage functions from common-ui; mocking
// the package keeps jest away from its expo-sqlite/native-module dependency chain.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import appSettingsReducer, { loadAppSettings, setOnboardingCompleted } from '../store/appSettingsSlice';
import type { AppSettingsSliceState } from '../store/appSettingsSlice';
import { loadAppSettings as loadAppSettingsFromStorage } from '../helpers/AppSettingsStorage';
import { getStorageItem } from 'repo-depkit-common-ui';

function initialState(): AppSettingsSliceState {
	return appSettingsReducer(undefined, { type: '@@INIT' });
}

describe('appSettings onboarding flag', () => {
	it('starts undefined so the gate waits for hydration', () => {
		expect(initialState().onboardingCompleted).toBeUndefined();
	});

	it('hydrates to false for a fresh install (onboarding shows)', () => {
		const state = appSettingsReducer(
			initialState(),
			loadAppSettings({ columnsPortrait: 1, columnsLandscape: 2, gamesSortMode: 'lastPlayed', onboardingCompleted: false }),
		);
		expect(state.onboardingCompleted).toBe(false);
	});

	it('hydrates to true for returning users (onboarding stays hidden)', () => {
		const state = appSettingsReducer(
			initialState(),
			loadAppSettings({ columnsPortrait: 1, columnsLandscape: 2, gamesSortMode: 'lastPlayed', onboardingCompleted: true }),
		);
		expect(state.onboardingCompleted).toBe(true);
	});

	it('coerces a missing persisted value to false instead of keeping undefined', () => {
		const state = appSettingsReducer(
			initialState(),
			loadAppSettings({
				columnsPortrait: 1,
				columnsLandscape: 2,
				gamesSortMode: 'lastPlayed',
				onboardingCompleted: undefined,
			}),
		);
		expect(state.onboardingCompleted).toBe(false);
	});

	it('setOnboardingCompleted flips the flag in both directions', () => {
		let state = appSettingsReducer(initialState(), setOnboardingCompleted(true));
		expect(state.onboardingCompleted).toBe(true);
		// The settings screen's "Einführung erneut ansehen" resets it to false.
		state = appSettingsReducer(state, setOnboardingCompleted(false));
		expect(state.onboardingCompleted).toBe(false);
	});
});

describe('AppSettingsStorage onboarding normalization', () => {
	const mockedGetStorageItem = getStorageItem as jest.Mock;

	it('defaults to false when nothing is persisted yet', async () => {
		mockedGetStorageItem.mockResolvedValueOnce(null);
		const settings = await loadAppSettingsFromStorage();
		expect(settings.onboardingCompleted).toBe(false);
	});

	it('reads back a persisted true', async () => {
		mockedGetStorageItem.mockResolvedValueOnce(
			JSON.stringify({ columnsPortrait: 1, columnsLandscape: 2, gamesSortMode: 'lastPlayed', onboardingCompleted: true }),
		);
		const settings = await loadAppSettingsFromStorage();
		expect(settings.onboardingCompleted).toBe(true);
	});

	it('treats corrupt values as not completed', async () => {
		mockedGetStorageItem.mockResolvedValueOnce(
			JSON.stringify({ columnsPortrait: 1, columnsLandscape: 2, gamesSortMode: 'lastPlayed', onboardingCompleted: 'yes' }),
		);
		const settings = await loadAppSettingsFromStorage();
		expect(settings.onboardingCompleted).toBe(false);
	});
});
