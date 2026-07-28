// Storage functions come from common-ui; mocking the package keeps jest away
// from its expo-sqlite/native-module dependency chain.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import { hasRecordedResults } from '../helpers/GameHistoryStorage';
import type { GameState } from '../helpers/GameStorage';

function baseGame(overrides: Partial<GameState> = {}): GameState {
	return {
		players: [
			{ id: 'a', name: 'A', color: '#fff' },
			{ id: 'b', name: 'B', color: '#000' },
		],
		rounds: [{ id: 'r1', scores: { a: null, b: null } }],
		status: 'active',
		currentRoundIndex: 0,
		matchId: 'm1',
		gameTypeId: undefined,
		playerOrderState: undefined,
		categoryValues: {},
		playerCategoryValues: {},
		...overrides,
	};
}

describe('hasRecordedResults', () => {
	it('is false for a fresh match without any entries', () => {
		expect(hasRecordedResults(baseGame())).toBe(false);
	});

	it('is true once any round score was entered', () => {
		expect(hasRecordedResults(baseGame({ rounds: [{ id: 'r1', scores: { a: 12, b: null } }] }))).toBe(true);
	});

	it('is true for a card selection even before its score differs from 0', () => {
		expect(
			hasRecordedResults(
				baseGame({ rounds: [{ id: 'r1', scores: { a: 0, b: null }, cardSelections: { a: ['card-1'] } }] }),
			),
		).toBe(true);
	});

	it('is true for recorded match-scope category values', () => {
		expect(hasRecordedResults(baseGame({ categoryValues: { map: 'Innsmouth' } }))).toBe(true);
	});

	it('is true for recorded player-scope category values', () => {
		expect(hasRecordedResults(baseGame({ playerCategoryValues: { a: { insanity: 'ja' } } }))).toBe(true);
	});

	it('stays false for empty per-player category objects', () => {
		expect(hasRecordedResults(baseGame({ playerCategoryValues: { a: {} } }))).toBe(false);
	});
});
