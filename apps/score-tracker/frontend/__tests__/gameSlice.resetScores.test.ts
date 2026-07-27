// The slice only needs the storage functions from common-ui; mocking the
// package keeps jest away from its expo-sqlite/native-module dependency chain.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import gameReducer, { addGuestPlayer, resetScores, startGame } from '../store/gameSlice';
import type { GameSliceState } from '../store/gameSlice';

function stateWithTwoPlayersInGame(): GameSliceState {
	let state = gameReducer(undefined, { type: '@@INIT' });
	state = gameReducer(state, addGuestPlayer());
	state = gameReducer(state, addGuestPlayer());
	return gameReducer(state, startGame(undefined));
}

describe('resetScores', () => {
	it('keeps the players by default (Alle Punkte zurücksetzen)', () => {
		const state = gameReducer(stateWithTwoPlayersInGame(), resetScores(undefined));
		expect(state.players).toHaveLength(2);
		expect(state.rounds).toHaveLength(0);
		expect(state.status).toBe('setup');
	});

	it('empties the seats with clearPlayers (Neue Partie starten)', () => {
		const state = gameReducer(stateWithTwoPlayersInGame(), resetScores({ clearPlayers: true }));
		expect(state.players).toHaveLength(0);
		expect(state.rounds).toHaveLength(0);
		expect(state.status).toBe('setup');
		expect(state.matchId).toBeUndefined();
	});
});
