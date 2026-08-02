/**
 * Unit tests for the built-in start/end/duration tracking of a match:
 * `startGame` stamps the start, `buildHistoryEntry` stores the duration, and
 * ending/reopening keeps the fields consistent (see helpers/MatchTimes).
 */

jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import gameReducer, { addGuestPlayer, loadMatch, reopenMatch, resetScores, setStartedAt, startGame } from '../store/gameSlice';
import { buildHistoryEntry } from '../helpers/GameHistoryStorage';

const START = new Date(2024, 4, 1, 19, 30).getTime();
const END = new Date(2024, 4, 1, 22, 45).getTime();

function startedState() {
	let state = gameReducer(undefined, { type: '@@INIT' });
	state = gameReducer(state, addGuestPlayer(undefined));
	return gameReducer(state, startGame(undefined));
}

describe('built-in match times', () => {
	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(START);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('startGame stamps the start time automatically', () => {
		const state = startedState();
		expect(state.startedAt).toBe(START);
		expect(state.endedAt).toBeUndefined();
		expect(state.durationMinutes).toBeUndefined();
	});

	it('setStartedAt corrects (and clears) the stamped start', () => {
		let state = startedState();
		state = gameReducer(state, setStartedAt(START - 60000));
		expect(state.startedAt).toBe(START - 60000);
		state = gameReducer(state, setStartedAt(null));
		expect(state.startedAt).toBeUndefined();
	});

	it('buildHistoryEntry stores start, end and the derived duration', () => {
		const state = startedState();
		const entry = buildHistoryEntry(state, { id: 'match-1', endedAt: END });
		expect(entry.startedAt).toBe(START);
		expect(entry.endedAt).toBe(END);
		expect(entry.durationMinutes).toBe(195);
	});

	it('loadMatch restores the archived times, reopenMatch clears end + duration but keeps the start', () => {
		const entry = buildHistoryEntry(startedState(), { id: 'match-1', endedAt: END });
		let state = gameReducer(undefined, { type: '@@INIT' });
		state = gameReducer(state, loadMatch(entry));
		expect(state.startedAt).toBe(START);
		expect(state.endedAt).toBe(END);
		expect(state.durationMinutes).toBe(195);

		state = gameReducer(state, reopenMatch());
		expect(state.startedAt).toBe(START);
		expect(state.endedAt).toBeUndefined();
		expect(state.durationMinutes).toBeUndefined();
	});

	it('resetScores clears the times for the follow-up match', () => {
		const state = gameReducer(startedState(), resetScores(undefined));
		expect(state.startedAt).toBeUndefined();
		expect(state.durationMinutes).toBeUndefined();
	});
});
