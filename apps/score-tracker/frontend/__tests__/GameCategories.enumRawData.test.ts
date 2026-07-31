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

import { enumOptionsToRawData, parseEnumOptionsRawData } from '../helpers/GameCategories';
import gameTypesReducer, { addGameType, addGameCategory, setGameCategoryOptions } from '../store/gameTypesSlice';

describe('parseEnumOptionsRawData', () => {
	it('round-trips the exported form and keeps existing option ids', () => {
		const options = [
			{ id: 'opt-won', label: 'Gewonnen' },
			{ id: 'opt-lost', label: 'Verloren' },
		];
		const parsed = parseEnumOptionsRawData(enumOptionsToRawData(options));
		expect(parsed).toEqual(options);
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
		expect(parsed?.[0]).toEqual({ id: 'opt-won', label: 'Gewonnen' });
		expect(parsed?.[1].label).toBe('Unentschieden');
	});

	it('trims labels', () => {
		const parsed = parseEnumOptionsRawData('["  Agatha Crane  "]');
		expect(parsed?.[0].label).toBe('Agatha Crane');
	});

	it.each([
		['malformed JSON', 'not json'],
		['a non-array', '{"label": "X"}'],
		['an empty list', '[]'],
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
