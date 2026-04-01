import { getLocales } from 'expo-localization';
import { useMemo } from 'react';
import translations from '../locales/translations.json';
import type { GeonexiaTranslationKeys } from '../locales/keys';

type SupportedLanguage = 'de' | 'en';

/** Returns the best-matching supported language based on the device locale. */
function detectLanguage(): SupportedLanguage {
	try {
		const locales = getLocales();
		for (const locale of locales) {
			const lang = locale.languageCode ?? '';
			if (lang === 'de') return 'de';
			if (lang === 'en') return 'en';
		}
	} catch {
		// Fallback to German when locale detection fails
	}
	return 'de';
}

const language: SupportedLanguage = detectLanguage();

/**
 * Returns a `translate` function that resolves a {@link GeonexiaTranslationKeys}
 * key to the localised string for the detected device language.
 *
 * The language is resolved once at module load time (device locale does not
 * change while the app is running).
 */
export function useTranslation() {
	const translate = useMemo(() => {
		return (key: GeonexiaTranslationKeys): string => {
			const entry = (translations as Record<string, Record<string, string>>)[key];
			if (!entry) return key;
			return entry[language] ?? entry['de'] ?? key;
		};
	}, []);

	return { translate, language };
}

/**
 * Translate a map-feature layer ID (e.g. `"landcover"`) to a human-readable
 * label using the current device locale.  Returns the raw `layerId` when no
 * translation is found.
 */
export function translateLayerId(layerId: string): string {
	const key = `layer_${layerId}` as GeonexiaTranslationKeys;
	const entry = (translations as Record<string, Record<string, string>>)[key];
	if (!entry) return layerId;
	return entry[language] ?? entry['de'] ?? layerId;
}

/**
 * Translate a map-feature class value (e.g. `"cemetery"`) to a human-readable
 * label using the current device locale.  Returns the raw class string when no
 * translation is found.
 */
export function translateClass(cls: string): string {
	const key = `class_${cls}` as GeonexiaTranslationKeys;
	const entry = (translations as Record<string, Record<string, string>>)[key];
	if (!entry) return cls;
	return entry[language] ?? entry['de'] ?? cls;
}

/**
 * Translate a map-feature subclass value (e.g. `"meadow"`) to a human-readable
 * label using the current device locale.  Returns the raw subclass string when
 * no translation is found.
 */
export function translateSubclass(subclass: string): string {
	const key = `subclass_${subclass}` as GeonexiaTranslationKeys;
	const entry = (translations as Record<string, Record<string, string>>)[key];
	if (!entry) return subclass;
	return entry[language] ?? entry['de'] ?? subclass;
}
