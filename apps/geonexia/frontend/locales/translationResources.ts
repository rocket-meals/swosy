/**
 * translationResources.ts – the single catalogue the whole app reads texts from.
 *
 * The shared vocabulary from `repo-depkit-common` is merged with the app-specific texts in
 * `translations.json`. App texts win, so a key can be reworded for Geonexia without touching
 * the shared package.
 *
 * Import this module instead of `translations.json`: a direct import of the JSON misses every
 * shared key and silently renders the raw key instead of the text.
 */

import {
	commonTranslations,
	mergeTranslationResources,
	TranslationLanguage,
	type TranslationResources,
} from 'repo-depkit-common';
import appTranslations from './translations.json';

/**
 * Languages Geonexia ships translations for.
 *
 * The shared catalogue covers all eight app languages; Geonexia only renders German and
 * English, so those are the two the validation test requires to be complete.
 */
export const SUPPORTED_TRANSLATION_LANGUAGES: readonly TranslationLanguage[] = [
	TranslationLanguage.DE,
	TranslationLanguage.EN,
];

/** Shared texts plus the Geonexia specific ones. */
export const translationResources: TranslationResources = mergeTranslationResources(
	commonTranslations,
	appTranslations as TranslationResources,
);
