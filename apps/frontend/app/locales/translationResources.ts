/**
 * translationResources.ts – the single catalogue the whole app reads texts from.
 *
 * The shared vocabulary from `repo-depkit-common` is merged with the app-specific texts in
 * `translations.json`. App texts win, so a key can be reworded for Rocket Meals without
 * touching the shared package.
 *
 * Import this module instead of `translations.json`: a direct import of the JSON misses every
 * shared key and silently renders the raw key instead of the text.
 */

import {
	ALL_TRANSLATION_LANGUAGES,
	commonTranslations,
	mergeTranslationResources,
	type TranslationLanguage,
	type TranslationResources,
} from 'repo-depkit-common';
import appTranslations from './translations.json';

/** Languages Rocket Meals ships translations for. */
export const SUPPORTED_TRANSLATION_LANGUAGES: readonly TranslationLanguage[] = ALL_TRANSLATION_LANGUAGES;

/** Shared texts plus the Rocket Meals specific ones. */
export const translationResources: TranslationResources = mergeTranslationResources(
	commonTranslations,
	appTranslations as TranslationResources,
);
