// The guard itself lives in repo-depkit-common-ui (shared with geonexia and
// score-tracker), but that package has no jest setup of its own - so it is
// covered here. Its barrel re-exports UI components (WebView, bottom-sheet, ...)
// which cannot be loaded in the jest environment, so the barrel is replaced by
// the real implementation of just this helper, addressed by path.
jest.mock('repo-depkit-common-ui', () => require('../../../../packages/common-ui/src/helpers/ExpoUpdatesHelper'));

// expo-updates reports itself as enabled here so the assertions below prove the
// development-runtime gate, not a missing updates configuration.
jest.mock('expo-updates', () => ({ isEnabled: true }));

jest.mock('@/constants/UrlHelper', () => ({
	UrlHelper: {
		getURLToLogin: () => 'app-rocket-meals://login',
	},
}));

import { isExpoUpdatesUnavailableError } from '../../../../packages/common-ui/src/helpers/ExpoUpdatesHelper';
import { areExpoUpdatesAvailable } from './DeviceRuntimeHelper';

describe('areExpoUpdatesAvailable', () => {
	it('is false while running in a development runtime (__DEV__)', () => {
		// Development builds run behind expo-dev-launcher, which rejects every
		// Updates.* call with NotAvailableInDevClientException, so the app must
		// never start an update check there.
		expect(__DEV__).toBe(true);
		expect(areExpoUpdatesAvailable()).toBe(false);
	});
});

describe('isExpoUpdatesUnavailableError', () => {
	it('recognises the development-build rejection', () => {
		const error = new Error(
			'NotAvailableInDevClientException: Updates.checkForUpdateAsync() is not supported in development builds. (at EXUpdates/DevLauncherAppController.swift:357)'
		);
		expect(isExpoUpdatesUnavailableError(error)).toBe(true);
	});

	it('recognises the rejection when it only carries an error name', () => {
		const error = new Error('Something went wrong');
		error.name = 'NotAvailableInDevClientException';
		expect(isExpoUpdatesUnavailableError(error)).toBe(true);
	});

	it('does not swallow real update failures', () => {
		expect(isExpoUpdatesUnavailableError(new Error('Network request failed'))).toBe(false);
		expect(isExpoUpdatesUnavailableError('manifest could not be parsed')).toBe(false);
	});
});
