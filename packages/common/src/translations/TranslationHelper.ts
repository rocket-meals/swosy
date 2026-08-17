/**
 * TranslationHelper.ts – the shared way to turn a translation key into a text.
 *
 * Every app used to re-implement the same three things: transposing the resource file for
 * i18next, looking a key up with a language fallback, and interpolating placeholders. They
 * now live here so all apps behave identically and the behaviour is covered by tests once.
 *
 * ```ts
 * const translate = createTranslator({
 * 	resources: mergeTranslationResources(commonTranslations, appTranslations),
 * 	language: TranslationLanguage.DE,
 * });
 * translate(TranslationKeys.save);                       // 'Speichern'
 * translate(TranslationKeys.greeting, { name: 'Nils' }); // 'Hallo Nils'
 * ```
 */

import {
	DEFAULT_TRANSLATION_LANGUAGE,
	TranslationLanguage,
	type TranslationLanguage as TranslationLanguageType,
} from './TranslationLanguage';
import type {
	I18nextResources,
	TranslationTextEntry,
	TranslationParams,
	TranslationResources,
	Translator,
} from './TranslationTypes';

/**
 * Language chain consulted when the selected language has no text for a key.
 *
 * German first because it is the source language all texts are authored in, English second
 * because it is the widest understood fallback.
 */
export const DEFAULT_FALLBACK_LANGUAGES: readonly TranslationLanguageType[] = [
	TranslationLanguage.DE,
	TranslationLanguage.EN,
];

/** Placeholder syntax shared with i18next: `{{name}}`, optionally padded with spaces. */
const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

/**
 * Replaces every `{{placeholder}}` in `template` with the matching value from `params`.
 *
 * Placeholders without a matching param are left untouched, so a forgotten value is visible
 * during development instead of silently collapsing to an empty string.
 */
export function interpolateTranslation(template: string, params?: TranslationParams): string {
	if (!params) {
		return template;
	}
	return template.replace(PLACEHOLDER_PATTERN, (match, placeholderName: string) => {
		const value = params[placeholderName];
		return value === undefined ? match : String(value);
	});
}

/**
 * Merges translation catalogues, later ones winning per language.
 *
 * Merging happens per key **and** per language, so an app can override a single language of
 * a shared key without having to restate the other seven.
 */
export function mergeTranslationResources(...resourcesList: readonly TranslationResources[]): TranslationResources {
	const merged: TranslationResources = {};
	for (const resources of resourcesList) {
		for (const key of Object.keys(resources)) {
			const entry = resources[key];
			if (entry === undefined) {
				continue;
			}
			merged[key] = { ...merged[key], ...entry };
		}
	}
	return merged;
}

export interface ResolveTranslationOptions {
	readonly resources: TranslationResources;
	readonly key: string;
	readonly language: TranslationLanguageType;
	/** Consulted in order when `language` has no text. Defaults to {@link DEFAULT_FALLBACK_LANGUAGES}. */
	readonly fallbackLanguages?: readonly TranslationLanguageType[];
}

/**
 * Looks a key up, walking the fallback chain.
 *
 * Returns `undefined` when neither the requested language nor any fallback has a non-empty
 * text – callers decide whether that is a missing-text placeholder or an error.
 */
export function resolveTranslation(options: ResolveTranslationOptions): string | undefined {
	const entry: TranslationTextEntry | undefined = options.resources[options.key];
	if (entry === undefined) {
		return undefined;
	}
	const fallbackLanguages = options.fallbackLanguages ?? DEFAULT_FALLBACK_LANGUAGES;
	for (const language of [options.language, ...fallbackLanguages]) {
		const text = entry[language];
		if (text !== undefined && text.length > 0) {
			return text;
		}
	}
	return undefined;
}

export interface CreateTranslatorOptions<TKey extends string> {
	readonly resources: TranslationResources;
	readonly language: TranslationLanguageType;
	/** Consulted in order when `language` has no text. Defaults to {@link DEFAULT_FALLBACK_LANGUAGES}. */
	readonly fallbackLanguages?: readonly TranslationLanguageType[];
	/**
	 * Called for keys without any usable text. Defaults to returning the key itself, which
	 * makes a missing translation obvious on screen and keeps it greppable in a screenshot.
	 */
	readonly onMissingTranslation?: (key: TKey, language: TranslationLanguageType) => string;
}

/**
 * Builds the `translate` function an app hands to its components.
 *
 * Narrow `TKey` to the app's own key union (`TranslationKeys`) so a typo cannot compile.
 */
export function createTranslator<TKey extends string = string>(
	options: CreateTranslatorOptions<TKey>,
): Translator<TKey> {
	const onMissingTranslation = options.onMissingTranslation ?? ((key: TKey): string => key);

	return (key: TKey, params?: TranslationParams): string => {
		const text = resolveTranslation({
			resources: options.resources,
			key,
			language: options.language,
			fallbackLanguages: options.fallbackLanguages,
		});
		if (text === undefined) {
			return onMissingTranslation(key, options.language);
		}
		return interpolateTranslation(text, params);
	};
}

/**
 * Transposes `{ key: { lang: text } }` into i18next's `{ lang: { key: text } }`.
 *
 * Empty texts are dropped so i18next falls through to its own fallback language instead of
 * rendering an empty label.
 */
export function toI18nextResources(resources: TranslationResources): I18nextResources {
	const i18nextResources: I18nextResources = {};
	for (const key of Object.keys(resources)) {
		const entry = resources[key];
		if (entry === undefined) {
			continue;
		}
		for (const language of Object.keys(entry) as TranslationLanguageType[]) {
			const text = entry[language];
			if (text === undefined || text.length === 0) {
				continue;
			}
			const bucket = i18nextResources[language] ?? {};
			bucket[key] = text;
			i18nextResources[language] = bucket;
		}
	}
	return i18nextResources;
}

/**
 * The languages a catalogue actually contains at least one non-empty text for.
 *
 * Used to build a language picker from the shipped data rather than a hand-kept list.
 */
export function getAvailableTranslationLanguages(
	resources: TranslationResources,
): TranslationLanguageType[] {
	const available = new Set<TranslationLanguageType>();
	for (const key of Object.keys(resources)) {
		const entry = resources[key];
		if (entry === undefined) {
			continue;
		}
		for (const language of Object.keys(entry) as TranslationLanguageType[]) {
			const text = entry[language];
			if (text !== undefined && text.length > 0) {
				available.add(language);
			}
		}
	}
	return [...available];
}

/** Convenience wrapper for one-off lookups outside of a React tree (scripts, helpers, tests). */
export function translateWithResources(options: ResolveTranslationOptions & { readonly params?: TranslationParams }): string {
	const text = resolveTranslation(options);
	if (text === undefined) {
		return options.key;
	}
	return interpolateTranslation(text, options.params);
}

/** Re-exported so consumers can build a translator without a second import. */
export const FALLBACK_TRANSLATION_LANGUAGE = DEFAULT_TRANSLATION_LANGUAGE;
