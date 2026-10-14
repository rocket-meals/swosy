import {
	DEFAULT_LANGUAGE_CODE,
	DEFAULT_LANGUAGE_CODE_BY_TRANSLATION_LANGUAGE,
	findBestMatchingLanguageCode,
	findMatchingLanguageCode,
	getLanguageCodeFromRelation,
	hasRegionCode,
	toFullLanguageCode,
} from '../translations/LanguageCodeHelper';
import { ALL_TRANSLATION_LANGUAGES, isSameBaseLanguage } from '../translations/TranslationLanguage';

// The codes the `languages` collection of the customers ships with (Studi-Futter, SWOSY).
const CUSTOMER_LANGUAGE_CODES = ['ar-SA', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'ru-RU', 'tr-TR', 'zh-CN'];

describe('DEFAULT_LANGUAGE_CODE_BY_TRANSLATION_LANGUAGE', () => {
	it('has a full code of the same language for every translation language', () => {
		for (const language of ALL_TRANSLATION_LANGUAGES) {
			const code = DEFAULT_LANGUAGE_CODE_BY_TRANSLATION_LANGUAGE[language];
			expect(code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
			expect(isSameBaseLanguage(code, language)).toBe(true);
		}
	});

	it('uses exactly the codes of the customer language tables', () => {
		expect(Object.values(DEFAULT_LANGUAGE_CODE_BY_TRANSLATION_LANGUAGE).sort()).toEqual([...CUSTOMER_LANGUAGE_CODES].sort());
	});

	it('defaults to German', () => {
		expect(DEFAULT_LANGUAGE_CODE).toBe('de-DE');
	});
});

describe('hasRegionCode', () => {
	it('detects a region', () => {
		expect(hasRegionCode('de-DE')).toBe(true);
		expect(hasRegionCode('de_AT')).toBe(true);
	});

	it('rejects short codes and empty values', () => {
		expect(hasRegionCode('de')).toBe(false);
		expect(hasRegionCode('de-')).toBe(false);
		expect(hasRegionCode('')).toBe(false);
		expect(hasRegionCode(null)).toBe(false);
		expect(hasRegionCode(undefined)).toBe(false);
	});
});

describe('toFullLanguageCode', () => {
	it('turns the short codes the app used to store into full codes', () => {
		expect(toFullLanguageCode('de')).toBe('de-DE');
		expect(toFullLanguageCode('en')).toBe('en-US');
		expect(toFullLanguageCode('zh')).toBe('zh-CN');
		expect(toFullLanguageCode(' DE ')).toBe('de-DE');
	});

	it('keeps a code that already has a region', () => {
		expect(toFullLanguageCode('de-DE')).toBe('de-DE');
		expect(toFullLanguageCode('de-AT')).toBe('de-AT');
		expect(toFullLanguageCode('de_AT')).toBe('de-AT');
	});

	it('gives undefined for unknown short codes and empty values', () => {
		expect(toFullLanguageCode('it')).toBeUndefined();
		expect(toFullLanguageCode('')).toBeUndefined();
		expect(toFullLanguageCode(null)).toBeUndefined();
		expect(toFullLanguageCode(undefined)).toBeUndefined();
	});
});

describe('getLanguageCodeFromRelation', () => {
	it('reads the raw key and the expanded row', () => {
		expect(getLanguageCodeFromRelation('de-DE')).toBe('de-DE');
		expect(getLanguageCodeFromRelation({ code: 'en-US' })).toBe('en-US');
	});

	it('gives undefined for missing values', () => {
		expect(getLanguageCodeFromRelation(null)).toBeUndefined();
		expect(getLanguageCodeFromRelation(undefined)).toBeUndefined();
		expect(getLanguageCodeFromRelation('  ')).toBeUndefined();
		expect(getLanguageCodeFromRelation({ code: null })).toBeUndefined();
	});
});

describe('findMatchingLanguageCode', () => {
	it('prefers the exact code, ignoring case', () => {
		expect(findMatchingLanguageCode('de-AT', ['de-DE', 'de-AT'])).toBe('de-AT');
		expect(findMatchingLanguageCode('DE-de', CUSTOMER_LANGUAGE_CODES)).toBe('de-DE');
	});

	it('falls back to the same language in another region', () => {
		expect(findMatchingLanguageCode('de', CUSTOMER_LANGUAGE_CODES)).toBe('de-DE');
		expect(findMatchingLanguageCode('en-GB', CUSTOMER_LANGUAGE_CODES)).toBe('en-US');
	});

	it('gives undefined when the table has no row for the language', () => {
		expect(findMatchingLanguageCode('it-IT', CUSTOMER_LANGUAGE_CODES)).toBeUndefined();
		expect(findMatchingLanguageCode('de-DE', [])).toBeUndefined();
		expect(findMatchingLanguageCode(undefined, CUSTOMER_LANGUAGE_CODES)).toBeUndefined();
	});
});

describe('findBestMatchingLanguageCode', () => {
	it('uses the match when there is one', () => {
		expect(findBestMatchingLanguageCode('tr', CUSTOMER_LANGUAGE_CODES)).toBe('tr-TR');
	});

	it('falls back to German, then English, then the first row', () => {
		expect(findBestMatchingLanguageCode('it-IT', CUSTOMER_LANGUAGE_CODES)).toBe('de-DE');
		expect(findBestMatchingLanguageCode('it-IT', ['fr-FR', 'en-US'])).toBe('en-US');
		expect(findBestMatchingLanguageCode('it-IT', ['fr-FR', 'es-ES'])).toBe('fr-FR');
	});

	it('follows the given fallback order', () => {
		expect(findBestMatchingLanguageCode(undefined, CUSTOMER_LANGUAGE_CODES, ['en'])).toBe('en-US');
	});

	it('gives undefined for an empty table', () => {
		expect(findBestMatchingLanguageCode('de-DE', [])).toBeUndefined();
	});
});
