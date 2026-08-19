import { getLocales } from 'expo-localization';
import { useMemo } from 'react';
import {
	createTranslator,
	resolveTranslationLanguage,
	TranslationLanguage,
	type Translator,
} from 'repo-depkit-common';
import { SUPPORTED_TRANSLATION_LANGUAGES, translationResources } from '../locales/translationResources';
import type { GeonexiaTranslationKeys } from '../locales/keys';

/** Returns the best-matching supported language based on the device locale. */
function detectLanguage(): TranslationLanguage {
	try {
		return resolveTranslationLanguage({
			locales: getLocales().map((locale) => locale.languageCode),
			supportedLanguages: SUPPORTED_TRANSLATION_LANGUAGES,
			fallbackLanguage: TranslationLanguage.DE,
		});
	} catch {
		// Fallback to German when locale detection fails
		return TranslationLanguage.DE;
	}
}

const language: TranslationLanguage = detectLanguage();

/**
 * `translate` resolves a {@link GeonexiaTranslationKeys} key against the merged catalogue
 * (shared `commonTranslations` + Geonexia's own texts), falling back German → English before
 * giving up and returning the raw key.
 *
 * The language is resolved once at module load time (the device locale does not change while
 * the app is running).
 */
const translator: Translator<GeonexiaTranslationKeys> = createTranslator<GeonexiaTranslationKeys>({
	resources: translationResources,
	language,
});

export function useTranslation() {
	const translate = useMemo(() => translator, []);
	return { translate, language };
}

/**
 * Translate a prefixed, data-driven key (map layer ids, feature classes, ...).
 *
 * These keys are built at runtime from server data, so they cannot be checked at compile
 * time; an unknown value falls back to the raw value instead of showing a prefixed key.
 */
function translateWithPrefix(prefix: string, value: string): string {
	const key = `${prefix}${value}` as GeonexiaTranslationKeys;
	const translated = translator(key);
	return translated === key ? value : translated;
}

/**
 * Translate a map-feature layer ID (e.g. `"landcover"`) to a human-readable
 * label using the current device locale.  Returns the raw `layerId` when no
 * translation is found.
 */
export function translateLayerId(layerId: string): string {
	return translateWithPrefix('layer_', layerId);
}

/**
 * Translate a map-feature class value (e.g. `"cemetery"`) to a human-readable
 * label using the current device locale.  Returns the raw class string when no
 * translation is found.
 */
export function translateClass(cls: string): string {
	return translateWithPrefix('class_', cls);
}

/**
 * Translate a map-feature subclass value (e.g. `"meadow"`) to a human-readable
 * label using the current device locale.  Returns the raw subclass string when
 * no translation is found.
 */
export function translateSubclass(subclass: string): string {
	return translateWithPrefix('subclass_', subclass);
}
