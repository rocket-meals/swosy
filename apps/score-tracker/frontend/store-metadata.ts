// Ground truth for the app store metadata ("App-Informationen") of Score Tracker.
// See packages/common/src/StoreAppMetadata.ts for the concept.
//
//   yarn store-metadata:pull:score-tracker
//   yarn store-metadata:push:score-tracker
import { DEFAULT_APPLE_AGE_RATING_DECLARATION, StoreAppMetadata } from 'repo-depkit-common';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, scoreTrackerConfig } from './config';

export function getStoreMetadata(): StoreAppMetadata[] {
	return [
		{
			displayName: scoreTrackerConfig.projectName,
			apple: {
				// Keep in sync with ios.bundleIdentifier in app.config.ts
				bundleId: 'de.baumgartner-software.score-tracker',
				primaryCategoryId: 'UTILITIES',
				// Explicitly no secondary category.
				secondaryCategoryId: null,
				// Served from the public repo; the in-app "Datenschutzerklärung"
				// (settings screen) mirrors the same text.
				privacyPolicyUrl: PRIVACY_POLICY_URL,
				ageRatingDeclaration: {
					...DEFAULT_APPLE_AGE_RATING_DECLARATION,
				},
			},
			google: {
				// Keep in sync with android.package in app.config.ts
				packageName: 'com.scoretracker.app',
				defaultLanguage: 'de-DE',
				contactEmail: SUPPORT_EMAIL,
			},
		},
	];
}
