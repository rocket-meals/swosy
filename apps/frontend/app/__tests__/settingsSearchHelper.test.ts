import { matchesSearch, normalizeSearchText } from '@/helper/SettingsSearchHelper';

describe('SettingsSearchHelper', () => {
	it('normalizes case and surrounding spaces', () => {
		expect(normalizeSearchText('  Sprache ')).toBe('sprache');
		expect(normalizeSearchText(undefined)).toBe('');
	});

	it('matches when the label contains the query', () => {
		expect(matchesSearch('Farbschema', normalizeSearchText('schema'))).toBe(true);
		expect(matchesSearch('Farbschema', normalizeSearchText('FARB'))).toBe(true);
		expect(matchesSearch('Farbschema', normalizeSearchText('Sprache'))).toBe(false);
		expect(matchesSearch(undefined, normalizeSearchText('Sprache'))).toBe(false);
	});

	it('matches everything while the query is empty', () => {
		expect(matchesSearch('Farbschema', normalizeSearchText('   '))).toBe(true);
		expect(matchesSearch(undefined, '')).toBe(true);
	});
});
