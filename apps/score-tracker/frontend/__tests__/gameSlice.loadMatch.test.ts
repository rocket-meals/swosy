// The slice only needs the storage functions from common-ui; mocking the
// package keeps jest away from its expo-sqlite/native-module dependency chain.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import gameReducer, { loadMatch, reopenMatch, setScore, startGame, goToNextRound } from '../store/gameSlice';
import type { GameSliceState } from '../store/gameSlice';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';

function archivedEntry(): GameHistoryEntry {
	return {
		id: 'match-1',
		endedAt: 1700000000000,
		roundsCount: 1,
		players: [
			{ playerId: 'p1', name: 'Anna', color: '#2563eb' },
			{ playerId: 'p2', name: 'Ben', color: '#dc2626' },
		],
		finalScores: { p1: 12, p2: 7 },
		gameTypeId: 'game-1',
		categoryValues: { cat1: 'opt-won' },
		playerCategoryValues: { p1: { cat2: true } },
		rounds: [
			{ id: 'r1', scores: { p1: 12, p2: 7 }, cardSelections: { p1: ['card-a'] }, startingPlayerId: 'p1' },
		],
	};
}

describe('loadMatch', () => {
	it('opens an archived match read-only, keeping players, rounds and category values', () => {
		const state = gameReducer(undefined, loadMatch(archivedEntry()));
		expect(state.status).toBe('finished');
		expect(state.matchId).toBe('match-1');
		expect(state.endedAt).toBe(1700000000000);
		expect(state.players.map((p) => p.name)).toEqual(['Anna', 'Ben']);
		expect(state.rounds).toHaveLength(1);
		expect(state.rounds[0].scores).toEqual({ p1: 12, p2: 7 });
		expect(state.rounds[0].cardSelections).toEqual({ p1: ['card-a'] });
		expect(state.categoryValues).toEqual({ cat1: 'opt-won' });
		expect(state.playerCategoryValues).toEqual({ p1: { cat2: true } });
	});

	it('does not share round objects with the history entry (editing must never rewrite the archive)', () => {
		const entry = archivedEntry();
		let state = gameReducer(undefined, loadMatch(entry));
		state = gameReducer(state, reopenMatch());
		state = gameReducer(state, setScore({ roundId: 'r1', playerId: 'p1', score: 99 }));
		expect(state.rounds[0].scores.p1).toBe(99);
		expect(entry.rounds?.[0].scores.p1).toBe(12);
	});

	it('falls back to a single round built from the final scores for old entries without rounds', () => {
		const entry = { ...archivedEntry(), rounds: undefined };
		const state = gameReducer(undefined, loadMatch(entry));
		expect(state.rounds).toHaveLength(1);
		expect(state.rounds[0].scores).toEqual({ p1: 12, p2: 7 });
	});
});

describe('finished (view-only) state', () => {
	function finishedState(): GameSliceState {
		return gameReducer(undefined, loadMatch(archivedEntry()));
	}

	it('ignores startGame, so a viewed match cannot be replaced by a fresh round', () => {
		const state = gameReducer(finishedState(), startGame(undefined));
		expect(state.status).toBe('finished');
		expect(state.rounds[0].scores).toEqual({ p1: 12, p2: 7 });
		expect(state.matchId).toBe('match-1');
	});

	it('reopenMatch puts the match back into play and clears the ended date', () => {
		const state = gameReducer(finishedState(), reopenMatch());
		expect(state.status).toBe('active');
		expect(state.endedAt).toBeUndefined();
		expect(state.matchId).toBe('match-1');
		expect(state.rounds).toHaveLength(1);
	});

	it('reopenMatch does nothing while a match is being set up or played', () => {
		let state = gameReducer(undefined, { type: '@@INIT' });
		expect(gameReducer(state, reopenMatch()).status).toBe('setup');
		state = gameReducer(state, startGame(undefined));
		expect(gameReducer(state, reopenMatch()).status).toBe('active');
	});

	it('never grows a finished match by a new round', () => {
		const state = gameReducer(finishedState(), goToNextRound(undefined));
		expect(state.rounds).toHaveLength(1);
		expect(state.currentRoundIndex).toBe(0);
	});

	it('a reopened match can grow new rounds again', () => {
		let state = gameReducer(finishedState(), reopenMatch());
		state = gameReducer(state, goToNextRound(undefined));
		expect(state.rounds).toHaveLength(2);
		expect(state.currentRoundIndex).toBe(1);
	});
});
