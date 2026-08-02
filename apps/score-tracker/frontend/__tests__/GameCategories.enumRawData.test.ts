/**
 * Unit tests for the enum "Rohdaten" import/export (helpers/GameCategories):
 * the whole option list as copy/paste JSON, plus the gameTypesSlice reducer
 * that applies an imported list to a category.
 */

// The slice only needs the storage functions from common-ui; mocking the
// package keeps jest away from its expo-sqlite/native-module dependency chain.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import { ENUM_OPTIONS_RAW_DATA_COMMENT_KEY, enumOptionsToRawData, parseEnumOptionsRawData } from '../helpers/GameCategories';
import gameTypesReducer, { addGameType, addGameCategory, setGameCategoryOptions } from '../store/gameTypesSlice';

describe('parseEnumOptionsRawData', () => {
	it('round-trips the exported form (comment entry ignored) and keeps existing option ids', () => {
		const options = [
			{ id: 'opt-won', label: 'Gewonnen' },
			{ id: 'opt-lost', label: 'Verloren' },
		];
		const rawData = enumOptionsToRawData(options);
		// The export leads with the explanatory comment entry for pasted-along AIs.
		expect((JSON.parse(rawData) as Record<string, unknown>[])[0][ENUM_OPTIONS_RAW_DATA_COMMENT_KEY]).toContain('"+"');
		expect(parseEnumOptionsRawData(rawData)).toEqual(options.map((option) => ({ ...option, imageBase64: null })));
	});

	it('treats "id": "+" as "create new" and generates distinct ids (Directus-style)', () => {
		const parsed = parseEnumOptionsRawData('[{"id": "+", "label": "Agatha Crane"}, {"id": "+", "label": "Rita Young"}]');
		expect(parsed).toHaveLength(2);
		expect(parsed?.[0].id).not.toBe('+');
		expect(parsed?.[1].id).not.toBe('+');
		expect(parsed?.[0].id).not.toBe(parsed?.[1].id);
	});

	it('strips a "//" comment key from an entry and skips pure comment entries', () => {
		const parsed = parseEnumOptionsRawData(
			'[{"//": "wird ignoriert"}, {"//": "neu", "id": "+", "label": "Carson Sinclair"}]',
		);
		expect(parsed).toHaveLength(1);
		expect(parsed?.[0].label).toBe('Carson Sinclair');
	});

	it('accepts plain strings and id-less objects, generating fresh ids', () => {
		const parsed = parseEnumOptionsRawData('["Agatha Crane", {"label": "Rita Young"}]');
		expect(parsed).toHaveLength(2);
		expect(parsed?.[0]).toMatchObject({ label: 'Agatha Crane' });
		expect(parsed?.[1]).toMatchObject({ label: 'Rita Young' });
		expect(parsed?.[0].id).toBeTruthy();
		expect(parsed?.[1].id).toBeTruthy();
		expect(parsed?.[0].id).not.toBe(parsed?.[1].id);
	});

	it('mixes kept and new entries, as pasted back after asking an AI to extend the list', () => {
		const parsed = parseEnumOptionsRawData('[{"id": "opt-won", "label": "Gewonnen"}, "Unentschieden"]');
		expect(parsed?.[0]).toEqual({ id: 'opt-won', label: 'Gewonnen', imageBase64: null });
		expect(parsed?.[1].label).toBe('Unentschieden');
	});

	it('keeps an option image and inherits the stored one for id-keeping entries without the field', () => {
		const current = [{ id: 'inv-1', label: 'Agatha Crane', imageBase64: 'data:image/jpeg;base64,AAAA' }];
		const parsed = parseEnumOptionsRawData(
			'[{"id": "inv-1", "label": "Agatha"}, {"id": "+", "label": "Rita", "imageBase64": "data:image/jpeg;base64,BBBB"}]',
			current,
		);
		// Text-only edit of an exported list must not wipe the uploaded picture.
		expect(parsed?.[0]).toEqual({ id: 'inv-1', label: 'Agatha', imageBase64: 'data:image/jpeg;base64,AAAA' });
		expect(parsed?.[1].imageBase64).toBe('data:image/jpeg;base64,BBBB');
	});

	it('clears a stored image when the pasted entry explicitly nulls it', () => {
		const current = [{ id: 'inv-1', label: 'Agatha Crane', imageBase64: 'data:image/jpeg;base64,AAAA' }];
		const parsed = parseEnumOptionsRawData('[{"id": "inv-1", "label": "Agatha Crane", "imageBase64": null}]', current);
		expect(parsed?.[0].imageBase64).toBeNull();
	});

	it('trims labels', () => {
		const parsed = parseEnumOptionsRawData('["  Agatha Crane  "]');
		expect(parsed?.[0].label).toBe('Agatha Crane');
	});

	it.each([
		['malformed JSON', 'not json'],
		['a non-array', '{"label": "X"}'],
		['an empty list', '[]'],
		['a list holding only a comment entry', '[{"//": "nur Kommentar"}]'],
		['an entry without a label', '[{"id": "a"}]'],
		['an empty label', '["  "]'],
		['a non-string id', '[{"id": 5, "label": "X"}]'],
		['duplicate ids', '[{"id": "a", "label": "X"}, {"id": "a", "label": "Y"}]'],
	])('rejects %s', (_name, raw) => {
		expect(parseEnumOptionsRawData(raw)).toBeNull();
	});
});

describe('setGameCategoryOptions', () => {
	it('replaces the option list of the targeted category', () => {
		let state = gameTypesReducer(undefined, { type: '@@INIT' });
		const addGameTypeAction = addGameType('Villen des Wahnsinns');
		state = gameTypesReducer(state, addGameTypeAction);
		const gameTypeId = addGameTypeAction.payload.id;
		const addCategoryAction = addGameCategory({ gameTypeId, name: 'Ermittler', type: 'enum', scope: 'player' });
		state = gameTypesReducer(state, addCategoryAction);
		const categoryId = addCategoryAction.payload.category.id;

		const imported = [
			{ id: 'inv-1', label: 'Agatha Crane' },
			{ id: 'inv-2', label: 'Rita Young' },
		];
		state = gameTypesReducer(state, setGameCategoryOptions({ gameTypeId, categoryId, options: imported }));
		expect(state.gameTypes[0].categories?.[0].options).toEqual(imported);
	});
});
