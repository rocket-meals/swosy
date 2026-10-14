import { isAutoTranslatedTranslation } from '@/helper/autoTranslationHelper';

describe('isAutoTranslatedTranslation', () => {
	it('detects a row filled by the machine translation', () => {
		expect(isAutoTranslatedTranslation({ let_be_translated: true, be_source_for_translations: false })).toBe(true);
		expect(isAutoTranslatedTranslation({ let_be_translated: true })).toBe(true);
	});

	it('does not flag the source row, even when it is set to be translated', () => {
		expect(isAutoTranslatedTranslation({ let_be_translated: true, be_source_for_translations: true })).toBe(false);
	});

	it('does not flag a row maintained by hand or a missing row', () => {
		expect(isAutoTranslatedTranslation({ let_be_translated: false, be_source_for_translations: false })).toBe(false);
		expect(isAutoTranslatedTranslation({})).toBe(false);
		expect(isAutoTranslatedTranslation(null)).toBe(false);
		expect(isAutoTranslatedTranslation(undefined)).toBe(false);
	});
});
