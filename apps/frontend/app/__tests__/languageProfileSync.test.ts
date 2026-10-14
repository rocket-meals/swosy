// The plan is pure, the store and the server helpers are not needed for it.
jest.mock('@/redux/store', () => ({ configureStore: { getState: () => ({}), dispatch: jest.fn(), subscribe: jest.fn() } }));
jest.mock('@/redux/hooks', () => ({ useAppSelector: jest.fn() }));
jest.mock('@/redux/actions/Profile/Profile', () => ({ ProfileHelper: jest.fn() }));
jest.mock('@/redux/actions/Languages/Languages', () => ({ LanguageCodesCache: { getLanguageCodes: jest.fn() } }));

import { planProfileLanguageSync } from '@/hooks/useLanguageProfileSync';
import { getTranslationLanguage } from '@/hooks/useLanguage';

// The codes the `languages` collection of the customers ships with (Studi-Futter, SWOSY).
const CUSTOMER_LANGUAGE_CODES = ['ar-SA', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'ru-RU', 'tr-TR', 'zh-CN'];

describe('planProfileLanguageSync', () => {
	it('writes the full code of a user of an older app version to a profile without language', () => {
		expect(planProfileLanguageSync('de', CUSTOMER_LANGUAGE_CODES, undefined)).toEqual({ localLanguage: 'de-DE', profileLanguage: 'de-DE' });
		expect(planProfileLanguageSync('zh', CUSTOMER_LANGUAGE_CODES, null)).toEqual({ localLanguage: 'zh-CN', profileLanguage: 'zh-CN' });
	});

	it('keeps the language the user sees and overwrites an outdated profile value', () => {
		expect(planProfileLanguageSync('en-US', CUSTOMER_LANGUAGE_CODES, 'de-DE')).toEqual({ localLanguage: undefined, profileLanguage: 'en-US' });
	});

	it('changes nothing when app and profile already agree, ignoring case', () => {
		expect(planProfileLanguageSync('de-DE', CUSTOMER_LANGUAGE_CODES, 'de-DE')).toEqual({ localLanguage: undefined, profileLanguage: undefined });
		expect(planProfileLanguageSync('de-DE', CUSTOMER_LANGUAGE_CODES, 'DE-de')).toEqual({ localLanguage: undefined, profileLanguage: undefined });
	});

	it("takes the server's spelling of the language", () => {
		expect(planProfileLanguageSync('de-DE', ['de-AT', 'en-US'], null)).toEqual({ localLanguage: 'de-AT', profileLanguage: 'de-AT' });
		expect(planProfileLanguageSync('de-AT', ['de-AT', 'en-US'], 'de-AT')).toEqual({ localLanguage: undefined, profileLanguage: undefined });
	});

	it('uses the app code when the languages table could not be read', () => {
		expect(planProfileLanguageSync('fr', null, null)).toEqual({ localLanguage: 'fr-FR', profileLanguage: 'fr-FR' });
		expect(planProfileLanguageSync('fr-FR', [], null)).toEqual({ localLanguage: undefined, profileLanguage: 'fr-FR' });
	});

	it('writes nothing for a language the server does not offer', () => {
		expect(planProfileLanguageSync('ar-SA', ['de-DE', 'en-US'], null)).toEqual({});
	});

	it('writes nothing without a known language', () => {
		expect(planProfileLanguageSync(undefined, CUSTOMER_LANGUAGE_CODES, null)).toEqual({});
		expect(planProfileLanguageSync('', CUSTOMER_LANGUAGE_CODES, null)).toEqual({});
	});
});

describe('getTranslationLanguage', () => {
	it('looks texts up with the short code of the stored full code', () => {
		expect(getTranslationLanguage('de-DE')).toBe('de');
		expect(getTranslationLanguage('en-US')).toBe('en');
		expect(getTranslationLanguage('zh-CN')).toBe('zh');
	});

	it('still accepts the short codes older app versions stored', () => {
		expect(getTranslationLanguage('en')).toBe('en');
		expect(getTranslationLanguage('tr')).toBe('tr');
	});

	it('falls back to German', () => {
		expect(getTranslationLanguage(undefined)).toBe('de');
		expect(getTranslationLanguage('it-IT')).toBe('de');
	});
});
