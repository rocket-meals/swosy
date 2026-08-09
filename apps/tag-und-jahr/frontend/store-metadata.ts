// Ground truth for the app store metadata ("App-Informationen") of Tag und Jahr.
// See packages/common/src/StoreAppMetadata.ts for the concept.
//
//   yarn store-metadata:pull:tag-und-jahr
//   yarn store-metadata:push:tag-und-jahr
import { DEFAULT_APPLE_AGE_RATING_DECLARATION, StoreAppMetadata } from 'repo-depkit-common';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, tagUndJahrConfig } from './config';

export function getStoreMetadata(): StoreAppMetadata[] {
	return [
		{
			displayName: tagUndJahrConfig.projectName,
			apple: {
				// Keep in sync with ios.bundleIdentifier in app.config.ts
				bundleId: 'de.baumgartner-software.tag-und-jahr',
				primaryCategoryId: 'LIFESTYLE',
				// Explicitly no secondary category.
				secondaryCategoryId: null,
				// Served from the public repo.
				privacyPolicyUrl: PRIVACY_POLICY_URL,
				ageRatingDeclaration: {
					...DEFAULT_APPLE_AGE_RATING_DECLARATION,
				},
			},
			google: {
				// Keep in sync with android.package in app.config.ts
				packageName: 'de.baumgartnersoftware.tagundjahr',
				defaultLanguage: 'de-DE',
				contactEmail: SUPPORT_EMAIL,
			},
		},
	];
}
