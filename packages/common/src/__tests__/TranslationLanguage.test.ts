import {
	ALL_TRANSLATION_LANGUAGES,
	DEFAULT_TRANSLATION_LANGUAGE,
	isTranslationLanguage,
	normalizeTranslationLanguage,
	resolveTranslationLanguage,
	TranslationLanguage,
} from '../translations/TranslationLanguage';

describe('TranslationLanguage', () => {
	it('lists every declared language exactly once', () => {
		const declared = Object.values(TranslationLanguage);
		expect([...ALL_TRANSLATION_LANGUAGES].sort()).toEqual([...declared].sort());
		expect(new Set(ALL_TRANSLATION_LANGUAGES).size).toBe(ALL_TRANSLATION_LANGUAGES.length);
	});

	it('uses lowercase ISO-639-1 codes', () => {
		for (const language of ALL_TRANSLATION_LANGUAGES) {
			expect(language).toMatch(/^[a-z]{2}$/);
		}
	});

	it('has a default language that is actually supported', () => {
		expect(ALL_TRANSLATION_LANGUAGES).toContain(DEFAULT_TRANSLATION_LANGUAGE);
	});
});

describe('isTranslationLanguage', () => {
	it('accepts supported codes', () => {
		expect(isTranslationLanguage('de')).toBe(true);
		expect(isTranslationLanguage('zh')).toBe(true);
	});

	it('rejects unsupported codes, locales and non-strings', () => {
		expect(isTranslationLanguage('it')).toBe(false);
		expect(isTranslationLanguage('de-DE')).toBe(false);
		expect(isTranslationLanguage('DE')).toBe(false);
		expect(isTranslationLanguage(undefined)).toBe(false);
		expect(isTranslationLanguage(null)).toBe(false);
		expect(isTranslationLanguage(42)).toBe(false);
	});
});

describe('normalizeTranslationLanguage', () => {
	it('strips the region from a locale identifier', () => {
		expect(normalizeTranslationLanguage('de-DE')).toBe(TranslationLanguage.DE);
		expect(normalizeTranslationLanguage('en_US')).toBe(TranslationLanguage.EN);
		expect(normalizeTranslationLanguage('zh-Hans-CN')).toBe(TranslationLanguage.ZH);
	});

	it('is case insensitive and trims whitespace', () => {
		expect(normalizeTranslationLanguage(' FR ')).toBe(TranslationLanguage.FR);
		expect(normalizeTranslationLanguage('RU-ru')).toBe(TranslationLanguage.RU);
	});

	it('returns undefined for unsupported or empty input', () => {
		expect(normalizeTranslationLanguage('it-IT')).toBeUndefined();
		expect(normalizeTranslationLanguage('')).toBeUndefined();
		expect(normalizeTranslationLanguage(null)).toBeUndefined();
		expect(normalizeTranslationLanguage(undefined)).toBeUndefined();
	});
});

describe('resolveTranslationLanguage', () => {
	it('returns the first supported candidate', () => {
		expect(resolveTranslationLanguage({ locales: ['it-IT', 'fr-CA', 'de-DE'] })).toBe(TranslationLanguage.FR);
	});

	it('skips candidates the app does not ship', () => {
		expect(
			resolveTranslationLanguage({
				locales: ['fr-CA', 'de-DE'],
				supportedLanguages: [TranslationLanguage.DE, TranslationLanguage.EN],
			}),
		).toBe(TranslationLanguage.DE);
	});

	it('falls back when nothing matches', () => {
		expect(
			resolveTranslationLanguage({
				locales: ['it-IT', null, undefined],
				supportedLanguages: [TranslationLanguage.DE, TranslationLanguage.EN],
				fallbackLanguage: TranslationLanguage.DE,
			}),
		).toBe(TranslationLanguage.DE);
	});

	it('falls back to the default language when no fallback is given', () => {
		expect(resolveTranslationLanguage({ locales: [] })).toBe(DEFAULT_TRANSLATION_LANGUAGE);
	});
});
