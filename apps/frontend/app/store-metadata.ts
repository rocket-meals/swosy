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
import { AppLinks, AppScreens, DEFAULT_APPLE_AGE_RATING_DECLARATION, ROCKET_MEALS_WEB_HOST, StoreAppMetadata, WikiCustomIds } from 'repo-depkit-common';
import { CustomerConfig, devConfig, studiFutterConfig, swosyConfig } from './config';

// All tenants (Demo, SWOSY, Studi|Futter) share the exact same metadata - only the app
// name and the per-tenant derived urls (privacy policy, privacy choices) differ. The
// values mirror the fully configured Rocket Meals demo app in App Store Connect (2025
// questionnaire, pulled via "store-metadata pull"); the reasoning is documented in
// docs/Apple Altersfreigabe.txt.
function tenantStoreMetadata(config: CustomerConfig): StoreAppMetadata {
	const metadata: StoreAppMetadata = {
		displayName: config.projectName,
	};
	if (config.bundleIdIos) {
		metadata.apple = {
			bundleId: config.bundleIdIos,
			primaryCategoryId: 'FOOD_AND_DRINK',
			// Explicitly no secondary category - keeps all tenants identical.
			secondaryCategoryId: null,
			contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',
			// Every tenant web app serves its privacy policy as a public wiki page - the
			// same url is used for the Google SSO consent screen (apps/backend/SSO_GOOGLE.md).
			privacyPolicyUrl: AppLinks.getPublicWikiUrl(config.baseUrl, WikiCustomIds.PRIVACY_POLICY),
			privacyChoicesUrl: AppLinks.getPublicWebUrl(config.baseUrl, AppScreens.DATA_ACCESS),
			ageRatingDeclaration: {
				...DEFAULT_APPLE_AGE_RATING_DECLARATION,
				// Canteens may list alcoholic drinks in their menus.
				alcoholTobaccoOrDrugUseOrReferences: 'INFREQUENT',
				contests: 'INFREQUENT',
			},
		};
	}
	if (config.bundleIdAndroid) {
		metadata.google = {
			packageName: config.bundleIdAndroid,
			contactEmail: 'nils@baumgartner-software.de',
			contactWebsite: ROCKET_MEALS_WEB_HOST,
			// Store listing texts (title, descriptions) are tenant specific and not yet
			// managed here - "store-metadata:pull" shows the current values from Google.
		};
	}
	return metadata;
}

export function getStoreMetadata(): StoreAppMetadata[] {
	return [devConfig, swosyConfig, studiFutterConfig].map(tenantStoreMetadata);
}
