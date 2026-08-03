// Ground truth for the app store metadata ("App-Informationen") of Geonexia.
// See packages/common/src/StoreAppMetadata.ts for the concept.
//
//   yarn store-metadata:pull:geonexia
//   yarn store-metadata:push:geonexia
import { DEFAULT_APPLE_AGE_RATING_DECLARATION, StoreAppMetadata } from 'repo-depkit-common';
import { geonexiaConfig } from './config';

export function getStoreMetadata(): StoreAppMetadata[] {
	return [
		{
			displayName: geonexiaConfig.projectName,
			apple: {
				// Keep in sync with ios.bundleIdentifier in app.config.ts
				bundleId: 'de.baumgartner-software.geonexia',
				ageRatingDeclaration: {
					...DEFAULT_APPLE_AGE_RATING_DECLARATION,
				},
			},
			google: {
				// Keep in sync with android.package in app.config.ts
				packageName: 'com.geonexia.app',
			},
		},
	];
}
