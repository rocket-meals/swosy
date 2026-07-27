import { computeNextStartingPlayerIndex, evaluatePlayerOrderExpr } from '../helpers/GameRules';
import type { PlayerOrderEvalContext } from '../helpers/GameRules';

// Round scores in table order: seat 0 = 5, seat 1 = 12, seat 2 = 3.
const SCORES: (number | null)[] = [5, 12, 3];
// Running totals in table order: seat 0 leads, seat 2 is last.
const TOTALS: (number | null)[] = [40, 25, 10];

function compute(
	mode: 'previousWinner' | 'previousLoser' | 'totalWinner' | 'totalLoser',
	scoringMode: 'highWins' | 'lowWins',
) {
	return computeNextStartingPlayerIndex({
		mode,
		playerCount: 3,
		previousStartIndex: 0,
		previousRoundScores: SCORES,
		totalScores: TOTALS,
		scoringMode,
		state: 0,
	});
}

describe('computeNextStartingPlayerIndex: previousWinner vs previousLoser', () => {
	it('previousWinner + highWins starts the seat with the most points', () => {
		expect(compute('previousWinner', 'highWins').startIndex).toBe(1);
	});

	it('previousWinner + lowWins starts the seat with the fewest points', () => {
		expect(compute('previousWinner', 'lowWins').startIndex).toBe(2);
	});

	it('previousLoser + highWins starts the seat with the fewest points', () => {
		expect(compute('previousLoser', 'highWins').startIndex).toBe(2);
	});

	// The Odin case: scored lowWins, yet whoever got the most points begins.
	it('previousLoser + lowWins starts the seat with the most points', () => {
		expect(compute('previousLoser', 'lowWins').startIndex).toBe(1);
	});

	it('ignores seats without an entered score', () => {
		const result = computeNextStartingPlayerIndex({
			mode: 'previousLoser',
			playerCount: 3,
			previousStartIndex: 0,
			previousRoundScores: [null, 4, 9],
			totalScores: [null, 4, 9],
			scoringMode: 'lowWins',
			state: 0,
		});
		expect(result.startIndex).toBe(2);
	});

	it('falls back to the previous starter when no scores were entered', () => {
		const result = computeNextStartingPlayerIndex({
			mode: 'previousLoser',
			playerCount: 3,
			previousStartIndex: 1,
			previousRoundScores: [null, null, null],
			totalScores: [null, null, null],
			scoringMode: 'highWins',
			state: 0,
		});
		expect(result.startIndex).toBe(1);
	});
});

describe('computeNextStartingPlayerIndex: totalWinner vs totalLoser', () => {
	it('totalWinner + highWins starts the seat with the highest total', () => {
		expect(compute('totalWinner', 'highWins').startIndex).toBe(0);
	});

	it('totalWinner + lowWins starts the seat with the lowest total', () => {
		expect(compute('totalWinner', 'lowWins').startIndex).toBe(2);
	});

	it('totalLoser + highWins starts the seat with the lowest total', () => {
		expect(compute('totalLoser', 'highWins').startIndex).toBe(2);
	});

	it('totalLoser + lowWins starts the seat with the highest total', () => {
		expect(compute('totalLoser', 'lowWins').startIndex).toBe(0);
	});

	it('falls back to the previous starter without any totals', () => {
		const result = computeNextStartingPlayerIndex({
			mode: 'totalWinner',
			playerCount: 3,
			previousStartIndex: 2,
			previousRoundScores: [null, null, null],
			totalScores: [null, null, null],
			scoringMode: 'highWins',
			state: 0,
		});
		expect(result.startIndex).toBe(2);
	});
});

describe('evaluatePlayerOrderExpr: round/total winner and loser', () => {
	const ctx: PlayerOrderEvalContext = {
		playerCount: 3,
		previousStartIndex: 0,
		previousRoundScores: SCORES,
		totalScores: TOTALS,
		scoringMode: 'lowWins',
		state: 0,
	};

	it('resolves to the round loser per the scoring mode', () => {
		expect(evaluatePlayerOrderExpr({ op: 'roundLoserIndex' }, ctx)).toBe(1);
		expect(evaluatePlayerOrderExpr({ op: 'roundLoserIndex' }, { ...ctx, scoringMode: 'highWins' })).toBe(2);
	});

	it('stays the counterpart of roundWinnerIndex', () => {
		expect(evaluatePlayerOrderExpr({ op: 'roundWinnerIndex' }, ctx)).toBe(2);
	});

	it('resolves total winner/loser against the running totals', () => {
		expect(evaluatePlayerOrderExpr({ op: 'totalWinnerIndex' }, ctx)).toBe(2);
		expect(evaluatePlayerOrderExpr({ op: 'totalLoserIndex' }, ctx)).toBe(0);
		expect(evaluatePlayerOrderExpr({ op: 'totalWinnerIndex' }, { ...ctx, scoringMode: 'highWins' })).toBe(0);
		expect(evaluatePlayerOrderExpr({ op: 'totalLoserIndex' }, { ...ctx, scoringMode: 'highWins' })).toBe(2);
	});
});
