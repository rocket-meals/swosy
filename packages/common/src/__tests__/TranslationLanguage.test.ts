import {
	ALL_TRANSLATION_LANGUAGES,
	DEFAULT_TRANSLATION_LANGUAGE,
	getBaseLanguageCode,
	isSameBaseLanguage,
	isSameLanguageCode,
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

describe('getBaseLanguageCode', () => {
	it('strips the region and lower-cases', () => {
		expect(getBaseLanguageCode('de')).toBe('de');
		expect(getBaseLanguageCode('de-DE')).toBe('de');
		expect(getBaseLanguageCode('DE_at')).toBe('de');
		expect(getBaseLanguageCode('  fr-CA  ')).toBe('fr');
	});

	it('also works for languages the apps ship no texts for', () => {
		// A customer may add any language to the Directus `languages` collection.
		expect(getBaseLanguageCode('it-IT')).toBe('it');
	});

	it('returns undefined for nothing usable', () => {
		expect(getBaseLanguageCode(undefined)).toBeUndefined();
		expect(getBaseLanguageCode(null)).toBeUndefined();
		expect(getBaseLanguageCode('')).toBeUndefined();
		expect(getBaseLanguageCode('   ')).toBeUndefined();
	});
});

describe('isSameLanguageCode', () => {
	it('ignores case but not the region', () => {
		expect(isSameLanguageCode('de-DE', 'DE-de')).toBe(true);
		expect(isSameLanguageCode('de', 'DE')).toBe(true);
		expect(isSameLanguageCode('de', 'de-DE')).toBe(false);
		expect(isSameLanguageCode('de-DE', 'de-AT')).toBe(false);
	});

	it('is false when either side is missing', () => {
		expect(isSameLanguageCode(undefined, 'de')).toBe(false);
		expect(isSameLanguageCode('de', null)).toBe(false);
		expect(isSameLanguageCode('', '')).toBe(false);
	});
});

describe('isSameBaseLanguage', () => {
	it('ignores case and region', () => {
		expect(isSameBaseLanguage('de', 'de-DE')).toBe(true);
		expect(isSameBaseLanguage('DE-de', 'de_AT')).toBe(true);
		expect(isSameBaseLanguage('it-IT', 'it-CH')).toBe(true);
	});

	it('keeps different languages apart', () => {
		expect(isSameBaseLanguage('de-DE', 'en-US')).toBe(false);
		expect(isSameBaseLanguage('de', undefined)).toBe(false);
	});
});
