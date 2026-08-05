import type { GameHistoryEntry, GameHistoryPlayerEntry } from '../helpers/GameHistoryStorage';
import type { GameType } from '../helpers/GameTypesStorage';
import {
	YEAR_GRID_WEEKS,
	buildYearActivityGrid,
	busiestDay,
	computeStreaks,
	dayIndexOf,
	entriesWithFriend,
	formatDayIndex,
	friendMatchCounts,
	friendWinCounts,
	gameMatchCounts,
	largestMatch,
	longestMatch,
	matchDurations,
	mostRoundsMatch,
	playCountsByDayIndex,
	totalPlayedMinutes,
	weekdayCounts,
} from '../helpers/StatsHelper';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let nextId = 0;

function player(overrides: Partial<GameHistoryPlayerEntry> = {}): GameHistoryPlayerEntry {
	nextId++;
	return { playerId: `p${nextId}`, name: `Player ${nextId}`, color: '#ff0000', ...overrides };
}

function entry(overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry {
	nextId++;
	return {
		id: `e${nextId}`,
		endedAt: new Date(2026, 7, 1, 20, 0).getTime(),
		roundsCount: 3,
		players: [],
		finalScores: {},
		...overrides,
	};
}

function gameType(overrides: Partial<GameType> = {}): GameType {
	nextId++;
	return { id: `g${nextId}`, name: `Game ${nextId}`, icon: '🎲', scoringMode: 'highWins', createdAt: 0, ...overrides };
}

/** Local 20:00 on the given calendar day. */
function eveningOf(year: number, month1: number, day: number): number {
	return new Date(year, month1 - 1, day, 20, 0).getTime();
}

// ─── Day helpers ──────────────────────────────────────────────────────────────

describe('dayIndexOf', () => {
	it('maps all timestamps of one local day to the same index', () => {
		const morning = new Date(2026, 7, 5, 0, 0).getTime();
		const night = new Date(2026, 7, 5, 23, 59).getTime();
		expect(dayIndexOf(morning)).toBe(dayIndexOf(night));
	});

	it('maps consecutive days to consecutive indices', () => {
		expect(dayIndexOf(eveningOf(2026, 8, 6))).toBe(dayIndexOf(eveningOf(2026, 8, 5)) + 1);
		// Across a month boundary too.
		expect(dayIndexOf(eveningOf(2026, 9, 1))).toBe(dayIndexOf(eveningOf(2026, 8, 31)) + 1);
	});
});

describe('formatDayIndex', () => {
	it('renders the index back as the local calendar day', () => {
		expect(formatDayIndex(dayIndexOf(eveningOf(2026, 8, 5)))).toBe('05.08.2026');
	});
});

describe('playCountsByDayIndex', () => {
	it('counts matches per local day of their end timestamp', () => {
		const entries = [
			entry({ endedAt: eveningOf(2026, 8, 5) }),
			entry({ endedAt: new Date(2026, 7, 5, 9, 0).getTime() }),
			entry({ endedAt: eveningOf(2026, 8, 6) }),
		];
		const counts = playCountsByDayIndex(entries);
		expect(counts.get(dayIndexOf(eveningOf(2026, 8, 5)))).toBe(2);
		expect(counts.get(dayIndexOf(eveningOf(2026, 8, 6)))).toBe(1);
		expect(counts.size).toBe(2);
	});
});

// ─── Play time ────────────────────────────────────────────────────────────────

describe('totalPlayedMinutes', () => {
	it('sums durations and skips entries without one', () => {
		const entries = [entry({ durationMinutes: 45 }), entry({ durationMinutes: 90 }), entry({})];
		expect(totalPlayedMinutes(entries)).toBe(135);
	});
});

describe('matchDurations', () => {
	it('collects recorded durations, skipping missing and zero ones', () => {
		const entries = [entry({ durationMinutes: 45 }), entry({ durationMinutes: 0 }), entry({})];
		expect(matchDurations(entries)).toEqual([45]);
	});

	it('filters by game when one is given', () => {
		const entries = [
			entry({ durationMinutes: 45, gameTypeId: 'skat' }),
			entry({ durationMinutes: 90, gameTypeId: 'phase10' }),
			entry({ durationMinutes: 30 }),
		];
		expect(matchDurations(entries, 'skat')).toEqual([45]);
		expect(matchDurations(entries)).toEqual([45, 90, 30]);
	});
});

// ─── Year activity grid ───────────────────────────────────────────────────────

describe('buildYearActivityGrid', () => {
	// A Wednesday.
	const now = new Date(2026, 7, 5, 12, 0);

	it('builds 52 Monday-aligned weeks ending with the current week', () => {
		const grid = buildYearActivityGrid([], now);
		expect(grid.weeks).toHaveLength(YEAR_GRID_WEEKS);
		for (const week of grid.weeks) {
			expect(week).toHaveLength(7);
		}
		// Last column is the current week: Monday (03.08.) through Sunday (09.08.).
		const lastWeek = grid.weeks[YEAR_GRID_WEEKS - 1];
		expect(formatDayIndex(lastWeek[0].dayIndex)).toBe('03.08.2026');
		expect(formatDayIndex(lastWeek[6].dayIndex)).toBe('09.08.2026');
		// Consecutive cells are consecutive days across the whole grid.
		const first = grid.weeks[0][0].dayIndex;
		expect(lastWeek[6].dayIndex - first).toBe(YEAR_GRID_WEEKS * 7 - 1);
	});

	it('marks days after today as future', () => {
		const grid = buildYearActivityGrid([], now);
		const lastWeek = grid.weeks[YEAR_GRID_WEEKS - 1];
		expect(lastWeek.map((day) => day.isFuture)).toEqual([false, false, false, true, true, true, true]);
	});

	it('fills in per-day match counts and the active day count', () => {
		const entries = [
			entry({ endedAt: eveningOf(2026, 8, 4) }),
			entry({ endedAt: eveningOf(2026, 8, 4) }),
			entry({ endedAt: eveningOf(2026, 8, 3) }),
			// Older than 52 weeks - outside the grid.
			entry({ endedAt: eveningOf(2024, 1, 1) }),
		];
		const grid = buildYearActivityGrid(entries, now);
		const lastWeek = grid.weeks[YEAR_GRID_WEEKS - 1];
		expect(lastWeek[0].count).toBe(1);
		expect(lastWeek[1].count).toBe(2);
		expect(grid.activeDayCount).toBe(2);
	});

	it('labels a column when a new month starts', () => {
		const grid = buildYearActivityGrid([], now);
		expect(grid.monthLabels).toHaveLength(YEAR_GRID_WEEKS);
		// The first column is always labelled; afterwards only on month changes.
		expect(grid.monthLabels[0]).not.toBeNull();
		const labels = grid.monthLabels.filter((label) => label !== null);
		expect(labels.length).toBeGreaterThanOrEqual(11);
		expect(labels.length).toBeLessThanOrEqual(13);
	});
});

// ─── Streaks ──────────────────────────────────────────────────────────────────

describe('computeStreaks', () => {
	const now = new Date(2026, 7, 5, 12, 0);

	it('returns zeros without any matches', () => {
		expect(computeStreaks([], now)).toEqual({ current: 0, longest: 0 });
	});

	it('finds the longest run of consecutive days', () => {
		const entries = [
			entry({ endedAt: eveningOf(2026, 6, 1) }),
			entry({ endedAt: eveningOf(2026, 6, 2) }),
			entry({ endedAt: eveningOf(2026, 6, 3) }),
			entry({ endedAt: eveningOf(2026, 6, 10) }),
		];
		expect(computeStreaks(entries, now)).toEqual({ current: 0, longest: 3 });
	});

	it('counts the current streak up to today', () => {
		const entries = [
			entry({ endedAt: eveningOf(2026, 8, 3) }),
			entry({ endedAt: eveningOf(2026, 8, 4) }),
			entry({ endedAt: new Date(2026, 7, 5, 10, 0).getTime() }),
		];
		expect(computeStreaks(entries, now)).toEqual({ current: 3, longest: 3 });
	});

	it('keeps a streak alive when today has not been played yet', () => {
		const entries = [entry({ endedAt: eveningOf(2026, 8, 3) }), entry({ endedAt: eveningOf(2026, 8, 4) })];
		expect(computeStreaks(entries, now).current).toBe(2);
	});

	it('ends the current streak when the last play was before yesterday', () => {
		const entries = [entry({ endedAt: eveningOf(2026, 8, 2) }), entry({ endedAt: eveningOf(2026, 8, 3) })];
		expect(computeStreaks(entries, now)).toEqual({ current: 0, longest: 2 });
	});

	it('counts multiple matches on one day as a single streak day', () => {
		const entries = [entry({ endedAt: eveningOf(2026, 8, 4) }), entry({ endedAt: new Date(2026, 7, 4, 10, 0).getTime() })];
		expect(computeStreaks(entries, now)).toEqual({ current: 1, longest: 1 });
	});
});

// ─── Weekdays ─────────────────────────────────────────────────────────────────

describe('weekdayCounts', () => {
	it('counts per weekday with Monday first', () => {
		const entries = [
			entry({ endedAt: eveningOf(2026, 8, 3) }), // Monday
			entry({ endedAt: eveningOf(2026, 8, 9) }), // Sunday
			entry({ endedAt: eveningOf(2026, 8, 2) }), // Sunday
		];
		expect(weekdayCounts(entries)).toEqual([1, 0, 0, 0, 0, 0, 2]);
	});
});

// ─── Rankings ─────────────────────────────────────────────────────────────────

describe('entriesWithFriend / friendMatchCounts', () => {
	it('finds the matches a friend took part in and counts per friend', () => {
		const entries = [
			entry({ players: [player({ friendId: 'anna' }), player()] }),
			entry({ players: [player({ friendId: 'anna' }), player({ friendId: 'ben' })] }),
			entry({ players: [player()] }),
		];
		expect(entriesWithFriend(entries, 'anna')).toHaveLength(2);
		expect(entriesWithFriend(entries, 'ben')).toHaveLength(1);
		const counts = friendMatchCounts(entries);
		expect(counts.get('anna')).toBe(2);
		expect(counts.get('ben')).toBe(1);
		expect(counts.size).toBe(2);
	});
});

describe('gameMatchCounts', () => {
	it('counts per game and collects game-less matches under null', () => {
		const entries = [entry({ gameTypeId: 'skat' }), entry({ gameTypeId: 'skat' }), entry({})];
		const counts = gameMatchCounts(entries);
		expect(counts.get('skat')).toBe(2);
		expect(counts.get(null)).toBe(1);
	});
});

describe('friendWinCounts', () => {
	it('awards the highest score by default and respects lowWins games', () => {
		const anna = player({ friendId: 'anna' });
		const ben = player({ friendId: 'ben' });
		const highGame = gameType({ id: 'high', scoringMode: 'highWins' });
		const lowGame = gameType({ id: 'low', scoringMode: 'lowWins' });
		const entries = [
			entry({ gameTypeId: 'high', players: [anna, ben], finalScores: { [anna.playerId]: 10, [ben.playerId]: 5 } }),
			entry({ gameTypeId: 'low', players: [anna, ben], finalScores: { [anna.playerId]: 10, [ben.playerId]: 5 } }),
		];
		const wins = friendWinCounts(entries, [highGame, lowGame]);
		expect(wins.get('anna')).toBe(1);
		expect(wins.get('ben')).toBe(1);
	});

	it('skips solo matches, all-tied matches and games without score tracking', () => {
		const anna = player({ friendId: 'anna' });
		const ben = player({ friendId: 'ben' });
		const noScores = gameType({ id: 'noscores', trackScores: false });
		const entries = [
			entry({ players: [anna], finalScores: { [anna.playerId]: 10 } }),
			entry({ players: [anna, ben], finalScores: { [anna.playerId]: 0, [ben.playerId]: 0 } }),
			entry({ gameTypeId: 'noscores', players: [anna, ben], finalScores: { [anna.playerId]: 10, [ben.playerId]: 5 } }),
		];
		expect(friendWinCounts(entries, [noScores]).size).toBe(0);
	});

	it('ignores winning guests without a friend id', () => {
		const guest = player();
		const ben = player({ friendId: 'ben' });
		const entries = [entry({ players: [guest, ben], finalScores: { [guest.playerId]: 10, [ben.playerId]: 5 } })];
		expect(friendWinCounts(entries, []).size).toBe(0);
	});
});

// ─── Records ──────────────────────────────────────────────────────────────────

describe('records', () => {
	it('finds the longest match, most rounds, largest table and busiest day', () => {
		const entries = [
			entry({ id: 'short', durationMinutes: 30, roundsCount: 10, players: [player()], endedAt: eveningOf(2026, 8, 1) }),
			entry({
				id: 'long',
				durationMinutes: 120,
				roundsCount: 2,
				players: [player(), player(), player()],
				endedAt: eveningOf(2026, 8, 1),
			}),
			entry({ id: 'other', roundsCount: 4, players: [player(), player()], endedAt: eveningOf(2026, 8, 2) }),
		];
		expect(longestMatch(entries)?.id).toBe('long');
		expect(mostRoundsMatch(entries)?.id).toBe('short');
		expect(largestMatch(entries)?.id).toBe('long');
		expect(busiestDay(entries)).toEqual({ dayIndex: dayIndexOf(eveningOf(2026, 8, 1)), count: 2 });
	});

	it('returns null on empty or duration-less histories', () => {
		expect(longestMatch([])).toBeNull();
		expect(longestMatch([entry({})])).toBeNull();
		expect(busiestDay([])).toBeNull();
	});
});
