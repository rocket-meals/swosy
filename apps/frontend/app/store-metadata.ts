// Ground truth for the app store metadata ("App-Informationen") of all rocket-meals
// tenant apps. See packages/common/src/StoreAppMetadata.ts for the concept.
//
//   yarn store-metadata:pull:rocket-meals
//   yarn store-metadata:push:rocket-meals
//
// Bundle ids come from config.ts so they cannot drift apart from the builds.
import { DEFAULT_APPLE_AGE_RATING_DECLARATION, StoreAppMetadata } from 'repo-depkit-common';
import { CustomerConfig, devConfig, studiFutterConfig, swosyConfig } from './config';

// All tenants ship the same app and therefore share the same answers to Apple's age
// rating questionnaire and the same category. The reasoning behind the answers is
// documented in docs/Apple Altersfreigabe.txt - keep both in sync.
function tenantStoreMetadata(config: CustomerConfig): StoreAppMetadata {
	const metadata: StoreAppMetadata = {
		displayName: config.projectName,
	};
	if (config.bundleIdIos) {
		metadata.apple = {
			bundleId: config.bundleIdIos,
			ageRatingDeclaration: {
				...DEFAULT_APPLE_AGE_RATING_DECLARATION,
				// Canteens may list alcoholic drinks in their menus.
				alcoholTobaccoOrDrugUseOrReferences: 'INFREQUENT_OR_MILD',
				contests: 'INFREQUENT_OR_MILD',
				// The capability questions of Apple's 2025 questionnaire (user generated
				// content: yes, messaging/chat: yes - see docs/Apple Altersfreigabe.txt)
				// can be added here once "store-metadata:pull" shows their API attribute
				// names for the ageRatingDeclaration.
			},
			primaryCategoryId: 'FOOD_AND_DRINK',
		};
	}
	if (config.bundleIdAndroid) {
		metadata.google = {
			packageName: config.bundleIdAndroid,
			contactEmail: 'nils@baumgartner-software.de',
			contactWebsite: 'https://rocket-meals.de',
			// Store listing texts (title, descriptions) are tenant specific and not yet
			// managed here - "store-metadata:pull" shows the current values from Google.
		};
	}
	return metadata;
}

export function getStoreMetadata(): StoreAppMetadata[] {
	return [devConfig, swosyConfig, studiFutterConfig].map(tenantStoreMetadata);
}
