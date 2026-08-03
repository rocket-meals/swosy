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
// The updated (2025) questionnaire uses INFREQUENT/FREQUENT, older declarations still
// report INFREQUENT_OR_MILD/FREQUENT_OR_INTENSE.
export type AppleAgeRatingLevel = 'NONE' | 'INFREQUENT' | 'FREQUENT' | 'INFREQUENT_OR_MILD' | 'FREQUENT_OR_INTENSE';

export type AppleAgeRatingDeclarationAttributes = {
	alcoholTobaccoOrDrugUseOrReferences?: AppleAgeRatingLevel;
	contests?: AppleAgeRatingLevel;
	gamblingSimulated?: AppleAgeRatingLevel;
	gunsOrOtherWeapons?: AppleAgeRatingLevel;
	horrorOrFearThemes?: AppleAgeRatingLevel;
	matureOrSuggestiveThemes?: AppleAgeRatingLevel;
	medicalOrTreatmentInformation?: AppleAgeRatingLevel;
	profanityOrCrudeHumor?: AppleAgeRatingLevel;
	sexualContentGraphicAndNudity?: AppleAgeRatingLevel;
	sexualContentOrNudity?: AppleAgeRatingLevel;
	violenceCartoonOrFantasy?: AppleAgeRatingLevel;
	violenceRealistic?: AppleAgeRatingLevel;
	violenceRealisticProlongedGraphicOrSadistic?: AppleAgeRatingLevel;
	advertising?: boolean;
	ageAssurance?: boolean;
	gambling?: boolean;
	healthOrWellnessTopics?: boolean;
	lootBox?: boolean;
	messagingAndChat?: boolean;
	parentalControls?: boolean;
	socialMedia?: boolean | null;
	socialMediaAgeRestricted?: boolean | null;
	unrestrictedWebAccess?: boolean;
	userGeneratedContent?: boolean;
	developerAgeRatingInfoUrl?: string | null;
	ageRatingOverride?: 'NONE' | 'SEVENTEEN_PLUS' | 'UNRATED';
	ageRatingOverrideV2?: string;
	koreaAgeRatingOverride?: 'NONE' | 'FIFTEEN_PLUS' | 'NINETEEN_PLUS';
	kidsAgeBand?: 'FIVE_AND_UNDER' | 'SIX_TO_EIGHT' | 'NINE_TO_ELEVEN' | null;
	// Apple extends the questionnaire over time. "store-metadata:pull" prints every
	// attribute Apple currently reports, so new questions can be answered here without
	// a type update.
	[appleAttribute: string]: unknown;
};

export type AppleAppMetadata = {
	bundleId: string;
	ageRatingDeclaration?: AppleAgeRatingDeclarationAttributes;
	// https://developer.apple.com/documentation/appstoreconnectapi/appcategory - e.g. 'FOOD_AND_DRINK'
	primaryCategoryId?: string;
	secondaryCategoryId?: string;
	contentRightsDeclaration?: 'DOES_NOT_USE_THIRD_PARTY_CONTENT' | 'USES_THIRD_PARTY_CONTENT';
	// Applied to every locale of the app's "App-Informationen" (appInfoLocalizations).
	privacyPolicyUrl?: string;
	privacyChoicesUrl?: string;
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
// and override single answers where their content differs. The attribute set matches
// what App Store Connect reports for the updated (2025) questionnaire - verified via
// "store-metadata pull" against the fully configured Rocket Meals demo app.
export const DEFAULT_APPLE_AGE_RATING_DECLARATION: AppleAgeRatingDeclarationAttributes = {
	alcoholTobaccoOrDrugUseOrReferences: 'NONE',
	contests: 'NONE',
	gamblingSimulated: 'NONE',
	gunsOrOtherWeapons: 'NONE',
	horrorOrFearThemes: 'NONE',
	matureOrSuggestiveThemes: 'NONE',
	medicalOrTreatmentInformation: 'NONE',
	profanityOrCrudeHumor: 'NONE',
	sexualContentGraphicAndNudity: 'NONE',
	sexualContentOrNudity: 'NONE',
	violenceCartoonOrFantasy: 'NONE',
	violenceRealistic: 'NONE',
	violenceRealisticProlongedGraphicOrSadistic: 'NONE',
	advertising: false,
	ageAssurance: false,
	gambling: false,
	healthOrWellnessTopics: false,
	lootBox: false,
	messagingAndChat: false,
	parentalControls: false,
	socialMedia: false,
	socialMediaAgeRestricted: false,
	unrestrictedWebAccess: false,
	userGeneratedContent: false,
	ageRatingOverride: 'NONE',
	ageRatingOverrideV2: 'NONE',
	koreaAgeRatingOverride: 'NONE',
	// null is a valid answer here ("not a kids app" / "no info url") - set explicitly so
	// these do not count as unanswered questions.
	kidsAgeBand: null,
	developerAgeRatingInfoUrl: null,
};
