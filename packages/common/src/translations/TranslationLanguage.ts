/**
 * TranslationLanguage.ts – the set of UI languages the apps in this monorepo translate into.
 *
 * These are plain ISO-639-1 codes ("de", "en", ...) and intentionally differ from
 * {@link LanguageCodes} (which holds full locale identifiers such as "de-DE" used for
 * date/number formatting). Translation resources are keyed by the short code because
 * that is what the shipped `translations.json` files and i18next resource bundles use.
 */

export const TranslationLanguage = {
	DE: 'de',
	EN: 'en',
	AR: 'ar',
	ES: 'es',
	FR: 'fr',
	RU: 'ru',
	TR: 'tr',
	ZH: 'zh',
} as const;

export type TranslationLanguage = (typeof TranslationLanguage)[keyof typeof TranslationLanguage];

/**
 * Every language the shared `commonTranslations` are provided in.
 *
 * An app may support a subset of these (Geonexia currently ships de/en only) – it then
 * validates against its own list instead of this one.
 */
export const ALL_TRANSLATION_LANGUAGES: readonly TranslationLanguage[] = [
	TranslationLanguage.DE,
	TranslationLanguage.EN,
	TranslationLanguage.AR,
	TranslationLanguage.ES,
	TranslationLanguage.FR,
	TranslationLanguage.RU,
	TranslationLanguage.TR,
	TranslationLanguage.ZH,
];

/** Used whenever no language could be resolved from the device or from user settings. */
export const DEFAULT_TRANSLATION_LANGUAGE: TranslationLanguage = TranslationLanguage.EN;

/** Type guard: is `value` one of the supported short language codes? */
export function isTranslationLanguage(value: unknown): value is TranslationLanguage {
	return typeof value === 'string' && (ALL_TRANSLATION_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Normalises a locale identifier to a short translation language code.
 *
 * Accepts anything a device locale API may hand out – `"de"`, `"de-DE"`, `"de_DE"`,
 * `"DE-de"` – and returns the matching short code, or `undefined` when the language is
 * not supported.
 */
export function normalizeTranslationLanguage(locale: string | null | undefined): TranslationLanguage | undefined {
	if (!locale) {
		return undefined;
	}
	const separatorIndex = locale.search(/[-_]/);
	const base = separatorIndex === -1 ? locale : locale.slice(0, separatorIndex);
	const lowerCased = base.trim().toLowerCase();
	return isTranslationLanguage(lowerCased) ? lowerCased : undefined;
}

export interface ResolveTranslationLanguageOptions {
	/** Locale candidates in priority order, e.g. the device locales reported by expo-localization. */
	readonly locales: readonly (string | null | undefined)[];
	/** Languages the app actually ships translations for. Defaults to {@link ALL_TRANSLATION_LANGUAGES}. */
	readonly supportedLanguages?: readonly TranslationLanguage[];
	/** Returned when no candidate matches. Defaults to {@link DEFAULT_TRANSLATION_LANGUAGE}. */
	readonly fallbackLanguage?: TranslationLanguage;
}

/**
 * Picks the first supported language out of a list of locale candidates.
 *
 * ```ts
 * resolveTranslationLanguage({ locales: ['fr-CA', 'de-DE'], supportedLanguages: [TranslationLanguage.DE] })
 * // -> 'de'
 * ```
 */
export function resolveTranslationLanguage(options: ResolveTranslationLanguageOptions): TranslationLanguage {
	const supportedLanguages = options.supportedLanguages ?? ALL_TRANSLATION_LANGUAGES;
	const fallbackLanguage = options.fallbackLanguage ?? DEFAULT_TRANSLATION_LANGUAGE;

	for (const locale of options.locales) {
		const normalized = normalizeTranslationLanguage(locale);
		if (normalized !== undefined && supportedLanguages.includes(normalized)) {
			return normalized;
		}
	}
	return fallbackLanguage;
}
