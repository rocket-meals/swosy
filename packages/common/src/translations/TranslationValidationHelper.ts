/**
 * TranslationValidationHelper.ts – catches broken translation data before it ships.
 *
 * The apps store their texts in hand-edited files, so the failure modes are always the same:
 * a key gets added to the key enum but nobody adds the text, a text is added for German only,
 * a screen is deleted and its texts rot in the catalogue, or two keys map to the same string.
 *
 * Each app runs {@link validateTranslations} over its own catalogue in a unit test, so those
 * mistakes fail CI instead of showing a raw key like `friendships_qr_hint` on screen.
 */

import { ALL_TRANSLATION_LANGUAGES, type TranslationLanguage } from './TranslationLanguage';
import type { TranslationResources } from './TranslationTypes';

/** A key that is declared but has no usable text in a given language. */
export interface MissingTranslation {
	readonly key: string;
	readonly language: TranslationLanguage;
	/** `'key'` – the key has no entry at all; `'language'` – the entry exists but this language is missing or empty. */
	readonly reason: 'key' | 'language';
}

export interface DuplicateTranslationText {
	readonly language: TranslationLanguage;
	readonly text: string;
	readonly keys: readonly string[];
}

export interface TranslationValidationReport {
	/** Declared keys without a usable text. */
	readonly missingTranslations: readonly MissingTranslation[];
	/** Catalogue entries that no declared key points at – dead texts. */
	readonly orphanedTranslationKeys: readonly string[];
	/** Keys declared more than once, or whose declared value does not equal its own name. */
	readonly invalidKeyDeclarations: readonly string[];
	/** Same text under several keys – merge candidates, reported but not an error by default. */
	readonly duplicateTexts: readonly DuplicateTranslationText[];
	/** True when nothing that breaks the UI was found. */
	readonly isValid: boolean;
}

export interface ValidateTranslationsOptions {
	/** Every translation key the app declares, e.g. `Object.values(TranslationKeys)`. */
	readonly keys: readonly string[];
	/** The catalogue the app ships, already merged with the shared `commonTranslations`. */
	readonly resources: TranslationResources;
	/** Languages that must be complete. Defaults to {@link ALL_TRANSLATION_LANGUAGES}. */
	readonly languages?: readonly TranslationLanguage[];
	/**
	 * Keys that are allowed to be missing – for texts that are still being translated.
	 * Keep this empty; every entry is a raw key shown to a user.
	 */
	readonly ignoredKeys?: readonly string[];
}

const toSet = (values: readonly string[] | undefined): Set<string> => new Set(values ?? []);

/**
 * Every (key, language) pair that has no usable text.
 *
 * A text counts as missing when it is absent, empty, or whitespace only – all three render
 * as an invisible label.
 */
export function findMissingTranslations(options: ValidateTranslationsOptions): MissingTranslation[] {
	const languages = options.languages ?? ALL_TRANSLATION_LANGUAGES;
	const ignoredKeys = toSet(options.ignoredKeys);
	const missing: MissingTranslation[] = [];

	for (const key of options.keys) {
		if (ignoredKeys.has(key)) {
			continue;
		}
		const entry = options.resources[key];
		if (entry === undefined) {
			for (const language of languages) {
				missing.push({ key, language, reason: 'key' });
			}
			continue;
		}
		for (const language of languages) {
			const text = entry[language];
			if (text === undefined || text.trim().length === 0) {
				missing.push({ key, language, reason: 'language' });
			}
		}
	}
	return missing;
}

/** Catalogue entries no declared key points at – texts that can be deleted. */
export function findOrphanedTranslationKeys(options: {
	readonly keys: readonly string[];
	readonly resources: TranslationResources;
	readonly ignoredKeys?: readonly string[];
}): string[] {
	const declaredKeys = toSet(options.keys);
	const ignoredKeys = toSet(options.ignoredKeys);
	return Object.keys(options.resources).filter((key) => !declaredKeys.has(key) && !ignoredKeys.has(key));
}

/**
 * Keys whose declared value does not match their own name, plus keys declared twice.
 *
 * The whole lookup scheme relies on `save: 'save'`; a mismatch such as `save: 'safe'` breaks
 * the catalogue lookup in a way that is invisible at the call site.
 */
export function findInvalidKeyDeclarations(keyDeclarations: Readonly<Record<string, string>>): string[] {
	const invalid: string[] = [];
	const seenValues = new Set<string>();

	for (const declaredName of Object.keys(keyDeclarations)) {
		const declaredValue = keyDeclarations[declaredName];
		if (declaredValue === undefined) {
			continue;
		}
		if (declaredValue !== declaredName) {
			invalid.push(`${declaredName} = '${declaredValue}' (value must equal the key name)`);
		}
		if (seenValues.has(declaredValue)) {
			invalid.push(`${declaredValue} (declared more than once)`);
		}
		seenValues.add(declaredValue);
	}
	return invalid;
}

/** Identical texts under several keys – candidates for reusing one shared key. */
export function findDuplicateTexts(options: {
	readonly resources: TranslationResources;
	readonly languages?: readonly TranslationLanguage[];
	readonly ignoredKeys?: readonly string[];
}): DuplicateTranslationText[] {
	const languages = options.languages ?? ALL_TRANSLATION_LANGUAGES;
	const ignoredKeys = toSet(options.ignoredKeys);
	const duplicates: DuplicateTranslationText[] = [];

	for (const language of languages) {
		const keysByText = new Map<string, string[]>();
		for (const key of Object.keys(options.resources)) {
			if (ignoredKeys.has(key)) {
				continue;
			}
			const text = options.resources[key]?.[language];
			if (text === undefined || text.trim().length === 0) {
				continue;
			}
			const bucket = keysByText.get(text) ?? [];
			bucket.push(key);
			keysByText.set(text, bucket);
		}
		for (const [text, keys] of keysByText) {
			if (keys.length > 1) {
				duplicates.push({ language, text, keys });
			}
		}
	}
	return duplicates;
}

/** Runs every check and rolls the findings into one report. */
export function validateTranslations(
	options: ValidateTranslationsOptions & { readonly keyDeclarations?: Readonly<Record<string, string>> },
): TranslationValidationReport {
	const missingTranslations = findMissingTranslations(options);
	const orphanedTranslationKeys = findOrphanedTranslationKeys(options);
	const invalidKeyDeclarations = options.keyDeclarations
		? findInvalidKeyDeclarations(options.keyDeclarations)
		: [];
	const duplicateTexts = findDuplicateTexts(options);

	return {
		missingTranslations,
		orphanedTranslationKeys,
		invalidKeyDeclarations,
		duplicateTexts,
		isValid:
			missingTranslations.length === 0 &&
			orphanedTranslationKeys.length === 0 &&
			invalidKeyDeclarations.length === 0,
	};
}

/**
 * Renders a report as the body of a test failure.
 *
 * Grouped by key rather than by language, because a missing text is almost always missing in
 * several languages at once and the flat list is unreadable at that size.
 */
export function formatTranslationValidationReport(report: TranslationValidationReport): string {
	const lines: string[] = [];

	if (report.invalidKeyDeclarations.length > 0) {
		lines.push(`Invalid key declarations (${report.invalidKeyDeclarations.length}):`);
		for (const invalid of report.invalidKeyDeclarations) {
			lines.push(`  - ${invalid}`);
		}
	}

	if (report.missingTranslations.length > 0) {
		const languagesByKey = new Map<string, string[]>();
		for (const missing of report.missingTranslations) {
			const bucket = languagesByKey.get(missing.key) ?? [];
			bucket.push(missing.language);
			languagesByKey.set(missing.key, bucket);
		}
		lines.push(`Missing translations for ${languagesByKey.size} key(s):`);
		for (const [key, languages] of languagesByKey) {
			lines.push(`  - ${key}: ${languages.join(', ')}`);
		}
	}

	if (report.orphanedTranslationKeys.length > 0) {
		lines.push(`Translations without a declared key (${report.orphanedTranslationKeys.length}):`);
		for (const key of report.orphanedTranslationKeys) {
			lines.push(`  - ${key}`);
		}
	}

	return lines.length === 0 ? 'No translation problems found.' : lines.join('\n');
}
