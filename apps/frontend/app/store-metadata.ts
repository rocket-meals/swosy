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
import { AppLinks, AppScreens, AppleAppMetadata, DEFAULT_APPLE_AGE_RATING_DECLARATION, GooglePlayAppMetadata, ROCKET_MEALS_WEB_HOST, StoreAppMetadata, WikiCustomIds } from 'repo-depkit-common';
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
			contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT',
			// Every tenant web app serves its privacy policy as a public wiki page - the
			// same url is used for the Google SSO consent screen (apps/backend/SSO_GOOGLE.md).
			privacyPolicyUrl: AppLinks.getPublicWikiUrl(config.baseUrl, WikiCustomIds.PRIVACY_POLICY),
			...overrides.apple,
			// Answers of the updated (2025) Apple questionnaire, pulled from the fully
			// configured Rocket Meals demo app in App Store Connect. The reasoning is
			// documented in docs/Apple Altersfreigabe.txt - keep both in sync.
			ageRatingDeclaration: {
				...DEFAULT_APPLE_AGE_RATING_DECLARATION,
				// Canteens may list alcoholic drinks in their menus.
				alcoholTobaccoOrDrugUseOrReferences: 'INFREQUENT',
				contests: 'INFREQUENT',
				...overrides.apple?.ageRatingDeclaration,
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
			...overrides.google,
		};
	}
	return metadata;
}

// Tenant overrides win over the shared values. They mirror what is configured in App
// Store Connect for each tenant - "store-metadata:pull" shows the current store values.
export function getStoreMetadata(): StoreAppMetadata[] {
	return [
		tenantStoreMetadata(devConfig),
		tenantStoreMetadata(swosyConfig, {
			apple: {
				contentRightsDeclaration: 'USES_THIRD_PARTY_CONTENT',
				secondaryCategoryId: 'NAVIGATION',
				privacyChoicesUrl: AppLinks.getPublicWebUrl(swosyConfig.baseUrl, AppScreens.DATA_ACCESS),
				// The tenant apps offer chat/support and user generated content (see
				// docs/Apple Altersfreigabe.txt), unlike the demo app.
				ageRatingDeclaration: { messagingAndChat: true, userGeneratedContent: true },
			},
		}),
		tenantStoreMetadata(studiFutterConfig, {
			apple: {
				secondaryCategoryId: 'EDUCATION',
				ageRatingDeclaration: { messagingAndChat: true, userGeneratedContent: true },
			},
		}),
	];
}
