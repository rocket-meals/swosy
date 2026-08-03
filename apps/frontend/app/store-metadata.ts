// Ground truth for the app store metadata ("App-Informationen") of all rocket-meals
// tenant apps. See packages/common/src/StoreAppMetadata.ts for the concept.
//
//   yarn store-metadata:pull:rocket-meals
//   yarn store-metadata:push:rocket-meals
//
// The iOS submit workflow also pushes this ground truth right before every review
// submission (see apps/scripts/submit-ios-review.ts), so Apple's recurring metadata
// questions (like the age rating questionnaire) only need to be answered here once.
//
// Bundle ids come from config.ts so they cannot drift apart from the builds.
import { AppleAppMetadata, DEFAULT_APPLE_AGE_RATING_DECLARATION, GooglePlayAppMetadata, StoreAppMetadata } from 'repo-depkit-common';
import { CustomerConfig, devConfig, studiFutterConfig, swosyConfig } from './config';

// Tenant-specific deviations from the shared metadata below (e.g. the privacy policy
// url). Only what really differs per tenant belongs here.
type TenantStoreOverrides = {
	apple?: Partial<Omit<AppleAppMetadata, 'bundleId'>>;
	google?: Partial<Omit<GooglePlayAppMetadata, 'packageName'>>;
};

// All tenants ship the same app and therefore share the same answers to Apple's age
// rating questionnaire and the same category. The reasoning behind the answers is
// documented in docs/Apple Altersfreigabe.txt - keep both in sync.
function tenantStoreMetadata(config: CustomerConfig, overrides: TenantStoreOverrides = {}): StoreAppMetadata {
	const metadata: StoreAppMetadata = {
		displayName: config.projectName,
	};
	if (config.bundleIdIos) {
		metadata.apple = {
			bundleId: config.bundleIdIos,
			primaryCategoryId: 'FOOD_AND_DRINK',
			...overrides.apple,
			ageRatingDeclaration: {
				...DEFAULT_APPLE_AGE_RATING_DECLARATION,
				// Canteens may list alcoholic drinks in their menus.
				alcoholTobaccoOrDrugUseOrReferences: 'INFREQUENT_OR_MILD',
				contests: 'INFREQUENT_OR_MILD',
				// The capability questions of Apple's 2025 questionnaire (user generated
				// content: yes, messaging/chat: yes - see docs/Apple Altersfreigabe.txt)
				// can be added here once "store-metadata:pull" shows their API attribute
				// names for the ageRatingDeclaration.
				...overrides.apple?.ageRatingDeclaration,
			},
		};
	}
	if (config.bundleIdAndroid) {
		metadata.google = {
			packageName: config.bundleIdAndroid,
			contactEmail: 'nils@baumgartner-software.de',
			contactWebsite: 'https://rocket-meals.de',
			// Store listing texts (title, descriptions) are tenant specific and not yet
			// managed here - "store-metadata:pull" shows the current values from Google.
			...overrides.google,
		};
	}
	return metadata;
}

export function getStoreMetadata(): StoreAppMetadata[] {
	return [
		tenantStoreMetadata(devConfig),
		tenantStoreMetadata(swosyConfig, {
			// Example: apple: { privacyPolicyUrl: 'https://.../datenschutz' }
			// "store-metadata:pull" shows the value currently stored in App Store Connect.
		}),
		tenantStoreMetadata(studiFutterConfig, {}),
	];
}
