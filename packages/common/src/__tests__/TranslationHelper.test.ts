import {
	createTranslator,
	getAvailableTranslationLanguages,
	interpolateTranslation,
	mergeTranslationResources,
	resolveTranslation,
	toI18nextResources,
	translateWithResources,
} from '../translations/TranslationHelper';
import { TranslationLanguage } from '../translations/TranslationLanguage';
import type { TranslationResources } from '../translations/TranslationTypes';

const RESOURCES: TranslationResources = {
	save: { de: 'Speichern', en: 'Save', fr: 'Enregistrer' },
	greeting: { de: 'Hallo {{name}}', en: 'Hello {{name}}' },
	german_only: { de: 'Nur Deutsch' },
	english_only: { en: 'English only' },
	empty_everywhere: { de: '', en: '' },
};

describe('interpolateTranslation', () => {
	it('replaces placeholders with the given values', () => {
		expect(interpolateTranslation('Hallo {{name}}', { name: 'Nils' })).toBe('Hallo Nils');
	});

	it('replaces every occurrence of the same placeholder', () => {
		expect(interpolateTranslation('{{a}} + {{a}}', { a: 1 })).toBe('1 + 1');
	});

	it('stringifies numbers', () => {
		expect(interpolateTranslation('{{count}} Einträge', { count: 3 })).toBe('3 Einträge');
	});

	it('tolerates whitespace inside the braces', () => {
		expect(interpolateTranslation('Hallo {{ name }}', { name: 'Nils' })).toBe('Hallo Nils');
	});

	it('leaves unknown placeholders untouched so they are noticed', () => {
		expect(interpolateTranslation('Hallo {{name}}', { other: 'x' })).toBe('Hallo {{name}}');
	});

	it('returns the template unchanged without params', () => {
		expect(interpolateTranslation('Hallo {{name}}')).toBe('Hallo {{name}}');
	});

	it('does not treat a replacement value as a replacement pattern', () => {
		expect(interpolateTranslation('{{a}}', { a: '$&$&' })).toBe('$&$&');
	});
});

describe('mergeTranslationResources', () => {
	it('merges catalogues with later ones winning', () => {
		const merged = mergeTranslationResources({ save: { de: 'A' } }, { save: { de: 'B' } });
		expect(merged.save?.de).toBe('B');
	});

	it('merges per language instead of replacing the whole entry', () => {
		const merged = mergeTranslationResources(
			{ save: { de: 'Speichern', en: 'Save' } },
			{ save: { de: 'Sichern' } },
		);
		expect(merged.save).toEqual({ de: 'Sichern', en: 'Save' });
	});

	it('keeps keys that only one catalogue declares', () => {
		const merged = mergeTranslationResources({ a: { de: 'A' } }, { b: { de: 'B' } });
		expect(Object.keys(merged).sort()).toEqual(['a', 'b']);
	});

	it('does not mutate its inputs', () => {
		const base = { save: { de: 'Speichern' } };
		mergeTranslationResources(base, { save: { de: 'Sichern' } });
		expect(base.save.de).toBe('Speichern');
	});

	it('returns an empty catalogue when called without arguments', () => {
		expect(mergeTranslationResources()).toEqual({});
	});
});

describe('resolveTranslation', () => {
	it('returns the text of the requested language', () => {
		expect(resolveTranslation({ resources: RESOURCES, key: 'save', language: TranslationLanguage.FR })).toBe(
			'Enregistrer',
		);
	});

	it('falls back to German before English', () => {
		expect(resolveTranslation({ resources: RESOURCES, key: 'german_only', language: TranslationLanguage.ZH })).toBe(
			'Nur Deutsch',
		);
	});

	it('falls back to English when German is missing too', () => {
		expect(resolveTranslation({ resources: RESOURCES, key: 'english_only', language: TranslationLanguage.ZH })).toBe(
			'English only',
		);
	});

	it('honours a custom fallback chain', () => {
		expect(
			resolveTranslation({
				resources: RESOURCES,
				key: 'save',
				language: TranslationLanguage.ZH,
				fallbackLanguages: [TranslationLanguage.EN],
			}),
		).toBe('Save');
	});

	it('returns undefined for an unknown key', () => {
		expect(resolveTranslation({ resources: RESOURCES, key: 'nope', language: TranslationLanguage.DE })).toBeUndefined();
	});

	it('treats an empty text as missing', () => {
		expect(
			resolveTranslation({ resources: RESOURCES, key: 'empty_everywhere', language: TranslationLanguage.DE }),
		).toBeUndefined();
	});
});

describe('createTranslator', () => {
	it('translates into the configured language', () => {
		const translate = createTranslator({ resources: RESOURCES, language: TranslationLanguage.DE });
		expect(translate('save')).toBe('Speichern');
	});

	it('interpolates params', () => {
		const translate = createTranslator({ resources: RESOURCES, language: TranslationLanguage.EN });
		expect(translate('greeting', { name: 'Nils' })).toBe('Hello Nils');
	});

	it('returns the key itself when nothing can be resolved', () => {
		const translate = createTranslator({ resources: RESOURCES, language: TranslationLanguage.DE });
		expect(translate('unknown_key')).toBe('unknown_key');
	});

	it('reports missing translations through the callback', () => {
		const onMissingTranslation = jest.fn().mockReturnValue('!!');
		const translate = createTranslator({
			resources: RESOURCES,
			language: TranslationLanguage.TR,
			onMissingTranslation,
		});
		expect(translate('unknown_key')).toBe('!!');
		expect(onMissingTranslation).toHaveBeenCalledWith('unknown_key', TranslationLanguage.TR);
	});

	it('does not call the missing handler for a resolvable fallback', () => {
		const onMissingTranslation = jest.fn().mockReturnValue('!!');
		const translate = createTranslator({
			resources: RESOURCES,
			language: TranslationLanguage.TR,
			onMissingTranslation,
		});
		expect(translate('german_only')).toBe('Nur Deutsch');
		expect(onMissingTranslation).not.toHaveBeenCalled();
	});
});

describe('toI18nextResources', () => {
	it('transposes key-first into language-first', () => {
		expect(toI18nextResources({ save: { de: 'Speichern', en: 'Save' } })).toEqual({
			de: { save: 'Speichern' },
			en: { save: 'Save' },
		});
	});

	it('drops empty texts so i18next can use its own fallback', () => {
		expect(toI18nextResources({ save: { de: 'Speichern', en: '' } })).toEqual({ de: { save: 'Speichern' } });
	});

	it('groups several keys under the same language', () => {
		expect(toI18nextResources({ a: { de: 'A' }, b: { de: 'B' } })).toEqual({ de: { a: 'A', b: 'B' } });
	});

	it('returns an empty object for an empty catalogue', () => {
		expect(toI18nextResources({})).toEqual({});
	});
});

describe('getAvailableTranslationLanguages', () => {
	it('lists only languages with at least one non-empty text', () => {
		expect(getAvailableTranslationLanguages({ a: { de: 'A', en: '' } })).toEqual([TranslationLanguage.DE]);
	});

	it('collects languages across keys without duplicates', () => {
		const available = getAvailableTranslationLanguages({ a: { de: 'A' }, b: { de: 'B', fr: 'F' } });
		expect([...available].sort()).toEqual([TranslationLanguage.DE, TranslationLanguage.FR].sort());
	});
});

describe('translateWithResources', () => {
	it('resolves and interpolates in one call', () => {
		expect(
			translateWithResources({
				resources: RESOURCES,
				key: 'greeting',
				language: TranslationLanguage.DE,
				params: { name: 'Nils' },
			}),
		).toBe('Hallo Nils');
	});

	it('returns the key when it cannot be resolved', () => {
		expect(translateWithResources({ resources: RESOURCES, key: 'nope', language: TranslationLanguage.DE })).toBe('nope');
	});
});
