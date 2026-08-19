import { TranslationLanguage } from '../translations/TranslationLanguage';
import type { TranslationResources } from '../translations/TranslationTypes';
import {
	findDuplicateTexts,
	findInvalidKeyDeclarations,
	findMissingTranslations,
	findOrphanedTranslationKeys,
	findSuspectedApostropheTruncations,
	formatTranslationValidationReport,
	validateTranslations,
} from '../translations/TranslationValidationHelper';

const LANGUAGES = [TranslationLanguage.DE, TranslationLanguage.EN];

const COMPLETE: TranslationResources = {
	save: { de: 'Speichern', en: 'Save' },
	cancel: { de: 'Abbrechen', en: 'Cancel' },
};

describe('findMissingTranslations', () => {
	it('finds nothing when every key is translated', () => {
		expect(findMissingTranslations({ keys: ['save', 'cancel'], resources: COMPLETE, languages: LANGUAGES })).toEqual([]);
	});

	it('reports one entry per language when the key has no entry at all', () => {
		const missing = findMissingTranslations({ keys: ['unknown'], resources: COMPLETE, languages: LANGUAGES });
		expect(missing).toEqual([
			{ key: 'unknown', language: TranslationLanguage.DE, reason: 'key' },
			{ key: 'unknown', language: TranslationLanguage.EN, reason: 'key' },
		]);
	});

	it('reports only the language that is missing', () => {
		const missing = findMissingTranslations({
			keys: ['save'],
			resources: { save: { de: 'Speichern' } },
			languages: LANGUAGES,
		});
		expect(missing).toEqual([{ key: 'save', language: TranslationLanguage.EN, reason: 'language' }]);
	});

	it('treats empty and whitespace-only texts as missing', () => {
		const missing = findMissingTranslations({
			keys: ['save', 'cancel'],
			resources: { save: { de: '', en: 'Save' }, cancel: { de: '   ', en: 'Cancel' } },
			languages: LANGUAGES,
		});
		expect(missing.map((entry) => entry.key)).toEqual(['save', 'cancel']);
	});

	it('skips ignored keys', () => {
		expect(
			findMissingTranslations({ keys: ['unknown'], resources: COMPLETE, languages: LANGUAGES, ignoredKeys: ['unknown'] }),
		).toEqual([]);
	});

	it('checks all shipped languages when none are given', () => {
		const missing = findMissingTranslations({ keys: ['save'], resources: { save: { de: 'Speichern' } } });
		expect(missing.map((entry) => entry.language)).not.toContain(TranslationLanguage.DE);
		expect(missing.map((entry) => entry.language)).toContain(TranslationLanguage.ZH);
	});
});

describe('findOrphanedTranslationKeys', () => {
	it('finds texts no key points at', () => {
		expect(findOrphanedTranslationKeys({ keys: ['save'], resources: COMPLETE })).toEqual(['cancel']);
	});

	it('finds nothing when every text is declared', () => {
		expect(findOrphanedTranslationKeys({ keys: ['save', 'cancel'], resources: COMPLETE })).toEqual([]);
	});

	it('skips ignored keys', () => {
		expect(findOrphanedTranslationKeys({ keys: ['save'], resources: COMPLETE, ignoredKeys: ['cancel'] })).toEqual([]);
	});
});

describe('findInvalidKeyDeclarations', () => {
	it('accepts declarations whose value equals their name', () => {
		expect(findInvalidKeyDeclarations({ save: 'save', cancel: 'cancel' })).toEqual([]);
	});

	it('rejects a value that does not match the name', () => {
		expect(findInvalidKeyDeclarations({ save: 'safe' })).toEqual([
			"save = 'safe' (value must equal the key name)",
		]);
	});

	it('reports two names mapping to the same value', () => {
		expect(findInvalidKeyDeclarations({ save: 'save', saveAlias: 'save' })).toContain('save (declared more than once)');
	});
});

describe('findDuplicateTexts', () => {
	it('finds the same text under two keys', () => {
		const duplicates = findDuplicateTexts({
			resources: { a: { de: 'Speichern' }, b: { de: 'Speichern' } },
			languages: [TranslationLanguage.DE],
		});
		expect(duplicates).toEqual([{ language: TranslationLanguage.DE, text: 'Speichern', keys: ['a', 'b'] }]);
	});

	it('ignores empty texts', () => {
		expect(findDuplicateTexts({ resources: { a: { de: '' }, b: { de: '' } }, languages: [TranslationLanguage.DE] })).toEqual(
			[],
		);
	});

	it('finds nothing when all texts differ', () => {
		expect(findDuplicateTexts({ resources: COMPLETE, languages: LANGUAGES })).toEqual([]);
	});
});

describe('validateTranslations', () => {
	it('is valid for a complete catalogue', () => {
		const report = validateTranslations({
			keys: ['save', 'cancel'],
			resources: COMPLETE,
			languages: LANGUAGES,
			keyDeclarations: { save: 'save', cancel: 'cancel' },
		});
		expect(report.isValid).toBe(true);
		expect(formatTranslationValidationReport(report)).toBe('No translation problems found.');
	});

	it('is invalid when a language is missing', () => {
		const report = validateTranslations({
			keys: ['save'],
			resources: { save: { de: 'Speichern' } },
			languages: LANGUAGES,
		});
		expect(report.isValid).toBe(false);
		expect(formatTranslationValidationReport(report)).toContain('save: en');
	});

	it('is invalid when a text is orphaned', () => {
		const report = validateTranslations({ keys: ['save'], resources: COMPLETE, languages: LANGUAGES });
		expect(report.isValid).toBe(false);
		expect(formatTranslationValidationReport(report)).toContain('cancel');
	});

	it('reports duplicate texts without failing the report', () => {
		const report = validateTranslations({
			keys: ['a', 'b'],
			resources: { a: { de: 'X', en: 'X' }, b: { de: 'X', en: 'X' } },
			languages: LANGUAGES,
		});
		expect(report.isValid).toBe(true);
		expect(report.duplicateTexts.length).toBeGreaterThan(0);
	});

	it('groups the languages of one key onto a single report line', () => {
		const report = validateTranslations({ keys: ['save'], resources: {}, languages: LANGUAGES });
		expect(formatTranslationValidationReport(report)).toContain('save: de, en');
	});
});

describe('findSuspectedApostropheTruncations', () => {
	const FRENCH = [TranslationLanguage.FR];

	it('finds nothing in intact texts', () => {
		expect(
			findSuspectedApostropheTruncations({
				resources: { today: { fr: "Aujourd'hui" }, copy_url: { fr: "Copier l'URL" } },
				languages: FRENCH,
			}),
		).toEqual([]);
	});

	it('finds a text that stops at an elided word', () => {
		const truncated = findSuspectedApostropheTruncations({
			resources: { today: { fr: 'Aujourd' }, until: { fr: 'jusqu' }, i_like_that: { fr: 'J' } },
			languages: FRENCH,
		});
		expect(truncated.map((entry) => entry.key).sort()).toEqual(['i_like_that', 'today', 'until']);
	});

	it('does not flag a short word that simply is the whole text', () => {
		expect(
			findSuspectedApostropheTruncations({
				resources: { no: { fr: 'Non' }, month: { fr: 'Mois' }, year: { fr: 'An' } },
				languages: FRENCH,
			}),
		).toEqual([]);
	});

	it('skips ignored keys and empty texts', () => {
		expect(
			findSuspectedApostropheTruncations({
				resources: { today: { fr: 'Aujourd' }, blank: { fr: '   ' } },
				languages: FRENCH,
				ignoredKeys: ['today'],
			}),
		).toEqual([]);
	});
});
