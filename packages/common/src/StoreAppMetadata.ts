// Ground truth for app store metadata ("App-Informationen") that Apple App Store Connect
// and the Google Play Console ask for. Each app (apps/frontend, apps/geonexia,
// apps/score-tracker, ...) defines its own ground truth in a store-metadata.ts file and
// the rocket-meals-scripts workspace syncs it via the store APIs:
//
//   yarn store-metadata:pull:<app>   - read the current values from Apple/Google
//   yarn store-metadata:push:<app>   - write the ground truth to Apple/Google
//
// Only fields that are set in the ground truth are managed (pushed); everything that is
// undefined stays untouched in the stores.

// https://developer.apple.com/documentation/appstoreconnectapi/ageratingdeclaration
export type AppleAgeRatingLevel = 'NONE' | 'INFREQUENT_OR_MILD' | 'FREQUENT_OR_INTENSE';

export type AppleAgeRatingDeclarationAttributes = {
	alcoholTobaccoOrDrugUseOrReferences?: AppleAgeRatingLevel;
	contests?: AppleAgeRatingLevel;
	gamblingSimulated?: AppleAgeRatingLevel;
	horrorOrFearThemes?: AppleAgeRatingLevel;
	matureOrSuggestiveThemes?: AppleAgeRatingLevel;
	medicalOrTreatmentInformation?: AppleAgeRatingLevel;
	profanityOrCrudeHumor?: AppleAgeRatingLevel;
	sexualContentGraphicAndNudity?: AppleAgeRatingLevel;
	sexualContentOrNudity?: AppleAgeRatingLevel;
	violenceCartoonOrFantasy?: AppleAgeRatingLevel;
	violenceRealistic?: AppleAgeRatingLevel;
	violenceRealisticProlongedGraphicOrSadistic?: AppleAgeRatingLevel;
	gambling?: boolean;
	lootBox?: boolean;
	unrestrictedWebAccess?: boolean;
	ageRatingOverride?: 'NONE' | 'SEVENTEEN_PLUS' | 'UNRATED';
	koreaAgeRatingOverride?: 'NONE' | 'FIFTEEN_PLUS' | 'NINETEEN_PLUS';
	kidsAgeBand?: 'FIVE_AND_UNDER' | 'SIX_TO_EIGHT' | 'NINE_TO_ELEVEN' | null;
	// Apple extends the questionnaire over time (e.g. the 2025 update with the new
	// 4+/9+/13+/16+/18+ ratings). "store-metadata:pull" prints every attribute Apple
	// currently reports, so new questions can be answered here without a type update.
	[appleAttribute: string]: unknown;
};

export type AppleAppMetadata = {
	bundleId: string;
	ageRatingDeclaration?: AppleAgeRatingDeclarationAttributes;
	// https://developer.apple.com/documentation/appstoreconnectapi/appcategory - e.g. 'FOOD_AND_DRINK'
	primaryCategoryId?: string;
	secondaryCategoryId?: string;
	contentRightsDeclaration?: 'DOES_NOT_USE_THIRD_PARTY_CONTENT' | 'USES_THIRD_PARTY_CONTENT';
};

// https://developers.google.com/android-publisher/api-ref/rest/v3/edits.listings
export type GooglePlayListing = {
	title?: string;
	shortDescription?: string;
	fullDescription?: string;
	video?: string;
};

export type GooglePlayAppMetadata = {
	packageName: string;
	// https://developers.google.com/android-publisher/api-ref/rest/v3/edits.details
	defaultLanguage?: string;
	contactEmail?: string;
	contactPhone?: string;
	contactWebsite?: string;
	// BCP-47 language code (e.g. 'de-DE') -> store listing
	listings?: Record<string, GooglePlayListing>;
};

export type StoreAppMetadata = {
	// Only used for logs and report file names
	displayName: string;
	apple?: AppleAppMetadata;
	google?: GooglePlayAppMetadata;
};

// All rocket-meals family apps share the same harmless content profile. Apps spread this
// and override single answers where their content differs.
export const DEFAULT_APPLE_AGE_RATING_DECLARATION: AppleAgeRatingDeclarationAttributes = {
	alcoholTobaccoOrDrugUseOrReferences: 'NONE',
	contests: 'NONE',
	gamblingSimulated: 'NONE',
	horrorOrFearThemes: 'NONE',
	matureOrSuggestiveThemes: 'NONE',
	medicalOrTreatmentInformation: 'NONE',
	profanityOrCrudeHumor: 'NONE',
	sexualContentGraphicAndNudity: 'NONE',
	sexualContentOrNudity: 'NONE',
	violenceCartoonOrFantasy: 'NONE',
	violenceRealistic: 'NONE',
	violenceRealisticProlongedGraphicOrSadistic: 'NONE',
	gambling: false,
	lootBox: false,
	unrestrictedWebAccess: false,
	ageRatingOverride: 'NONE',
	koreaAgeRatingOverride: 'NONE',
};
