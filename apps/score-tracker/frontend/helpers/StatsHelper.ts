import type { GameHistoryEntry } from './GameHistoryStorage';
import type { GameType } from './GameTypesStorage';

// ─── Statistics over the archived matches ─────────────────────────────────────
//
// Pure computation helpers for the Statistik screen (app/stats). Everything
// works on the archived matches (see GameHistoryStorage) - a match counts on
// the calendar day it ended, in local time.

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Local calendar day of a timestamp as a stable index. Uses `Date.UTC` of the
 * local date parts, so the result is an exact day number without DST rounding
 * issues - two timestamps on the same local day always map to the same index,
 * and consecutive days differ by exactly 1.
 */
export function dayIndexOf(timestamp: number): number {
	const date = new Date(timestamp);
	return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

/** Day index (see `dayIndexOf`) → `DD.MM.YYYY` for display. */
export function formatDayIndex(dayIndex: number): string {
	const date = new Date(dayIndex * DAY_MS);
	const pad2 = (value: number) => (value < 10 ? `0${value}` : String(value));
	return `${pad2(date.getUTCDate())}.${pad2(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

/** How many matches ended on each local calendar day, keyed by day index. */
export function playCountsByDayIndex(entries: GameHistoryEntry[]): Map<number, number> {
	const counts = new Map<number, number>();
	for (const entry of entries) {
		const day = dayIndexOf(entry.endedAt);
		counts.set(day, (counts.get(day) ?? 0) + 1);
	}
	return counts;
}

/** Sum of all recorded match durations. Entries without a duration contribute nothing. */
export function totalPlayedMinutes(entries: GameHistoryEntry[]): number {
	let total = 0;
	for (const entry of entries) {
		total += entry.durationMinutes ?? 0;
	}
	return total;
}

// ─── GitHub-style year activity grid ──────────────────────────────────────────

export const YEAR_GRID_WEEKS = 52;

export type YearActivityDay = {
	/** Day index of this cell (see `dayIndexOf`). */
	dayIndex: number;
	/** Matches ended on this day. */
	count: number;
	/** Days after "today" - rendered empty instead of grey. */
	isFuture: boolean;
};

export type YearActivityGridData = {
	/** 52 weeks, oldest first; each week holds 7 days Monday→Sunday. */
	weeks: YearActivityDay[][];
	/** Month label per week column (e.g. 'Jan'), null when the column starts no new month. */
	monthLabels: (string | null)[];
	/** Days in the shown range with at least one match. */
	activeDayCount: number;
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/**
 * Builds the data for the GitHub-like year overview: 52 week columns ending
 * with the current week, each a Monday→Sunday run of per-day match counts.
 */
export function buildYearActivityGrid(entries: GameHistoryEntry[], now: Date): YearActivityGridData {
	const counts = playCountsByDayIndex(entries);
	const todayIndex = dayIndexOf(now.getTime());
	// Monday of the current week (getDay(): 0 = Sunday).
	const mondayOffset = (now.getDay() + 6) % 7;
	const currentMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);

	const weeks: YearActivityDay[][] = [];
	const monthLabels: (string | null)[] = [];
	let previousMonth = -1;
	let activeDayCount = 0;

	for (let week = 0; week < YEAR_GRID_WEEKS; week++) {
		// Building each date from local date parts keeps the columns aligned to
		// calendar days across DST changes.
		const weekStart = new Date(
			currentMonday.getFullYear(),
			currentMonday.getMonth(),
			currentMonday.getDate() - 7 * (YEAR_GRID_WEEKS - 1 - week),
		);
		const month = weekStart.getMonth();
		monthLabels.push(month === previousMonth ? null : MONTH_SHORT[month]);
		previousMonth = month;

		const days: YearActivityDay[] = [];
		for (let weekday = 0; weekday < 7; weekday++) {
			const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + weekday);
			const dayIndex = dayIndexOf(date.getTime());
			const count = counts.get(dayIndex) ?? 0;
			const isFuture = dayIndex > todayIndex;
			if (!isFuture && count > 0) activeDayCount++;
			days.push({ dayIndex, count, isFuture });
		}
		weeks.push(days);
	}

	return { weeks, monthLabels, activeDayCount };
}

// ─── Streaks ──────────────────────────────────────────────────────────────────

/**
 * Longest run of consecutive play days ever, and the currently running one.
 * The current streak also counts when the last play day was yesterday - today
 * simply hasn't been played yet, the streak is still alive.
 */
export function computeStreaks(entries: GameHistoryEntry[], now: Date): { current: number; longest: number } {
	const days = [...playCountsByDayIndex(entries).keys()].sort((a, b) => a - b);

	let longest = 0;
	let run = 0;
	for (let i = 0; i < days.length; i++) {
		run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
		if (run > longest) longest = run;
	}

	const played = new Set(days);
	const todayIndex = dayIndexOf(now.getTime());
	let current = 0;
	let cursor = played.has(todayIndex) ? todayIndex : todayIndex - 1;
	while (played.has(cursor)) {
		current++;
		cursor--;
	}

	return { current, longest };
}

// ─── Weekday distribution ─────────────────────────────────────────────────────

export const WEEKDAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;

/** Matches per weekday, index 0 = Monday … 6 = Sunday. */
export function weekdayCounts(entries: GameHistoryEntry[]): number[] {
	const counts = [0, 0, 0, 0, 0, 0, 0];
	for (const entry of entries) {
		counts[(new Date(entry.endedAt).getDay() + 6) % 7]++;
	}
	return counts;
}

// ─── Durations for the boxplots ───────────────────────────────────────────────

/**
 * Recorded durations (minutes) of the given matches, optionally restricted to
 * one game. Matches without a duration - or with a zero one, which is a
 * timestamp artifact rather than a played match - are left out.
 */
export function matchDurations(entries: GameHistoryEntry[], gameTypeId?: string): number[] {
	const durations: number[] = [];
	for (const entry of entries) {
		if (gameTypeId !== undefined && entry.gameTypeId !== gameTypeId) continue;
		if (entry.durationMinutes != null && entry.durationMinutes > 0) durations.push(entry.durationMinutes);
	}
	return durations;
}

/** The matches a friend took part in. */
export function entriesWithFriend(entries: GameHistoryEntry[], friendId: string): GameHistoryEntry[] {
	return entries.filter((entry) => entry.players.some((player) => player.friendId === friendId));
}

// ─── Rankings ─────────────────────────────────────────────────────────────────

/** Matches played per friend, keyed by friend id. Guests (no friend id) are not counted. */
export function friendMatchCounts(entries: GameHistoryEntry[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const entry of entries) {
		for (const player of entry.players) {
			if (!player.friendId) continue;
			counts.set(player.friendId, (counts.get(player.friendId) ?? 0) + 1);
		}
	}
	return counts;
}

/** Matches per game, keyed by game type id; `null` collects the matches played without a game. */
export function gameMatchCounts(entries: GameHistoryEntry[]): Map<string | null, number> {
	const counts = new Map<string | null, number>();
	for (const entry of entries) {
		const key = entry.gameTypeId ?? null;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return counts;
}

/**
 * Won matches per friend. A match counts when it had at least two players and
 * not everyone ended on the same score (an all-tied match is usually one where
 * nothing was recorded). Whether the highest or lowest total wins comes from
 * the game's scoring mode (default: highest); games that don't track scores at
 * all are skipped, as are winning guests without a friend id.
 */
export function friendWinCounts(entries: GameHistoryEntry[], gameTypes: GameType[]): Map<string, number> {
	const gameTypeById = new Map(gameTypes.map((gameType) => [gameType.id, gameType]));
	const wins = new Map<string, number>();
	for (const entry of entries) {
		if (entry.players.length < 2) continue;
		const gameType = entry.gameTypeId ? gameTypeById.get(entry.gameTypeId) : undefined;
		if (gameType?.trackScores === false) continue;
		const scores = entry.players.map((player) => entry.finalScores[player.playerId] ?? 0);
		if (scores.every((score) => score === scores[0])) continue;
		const lowWins = (gameType?.scoringMode ?? 'highWins') === 'lowWins';
		const best = lowWins ? Math.min(...scores) : Math.max(...scores);
		entry.players.forEach((player, index) => {
			if (scores[index] === best && player.friendId) {
				wins.set(player.friendId, (wins.get(player.friendId) ?? 0) + 1);
			}
		});
	}
	return wins;
}

// ─── Records ──────────────────────────────────────────────────────────────────

/** The entry with the highest value, or null when no entry yields a positive one. */
function maxByValue(entries: GameHistoryEntry[], value: (entry: GameHistoryEntry) => number): GameHistoryEntry | null {
	let best: GameHistoryEntry | null = null;
	let bestValue = 0;
	for (const entry of entries) {
		const entryValue = value(entry);
		if (entryValue > bestValue) {
			best = entry;
			bestValue = entryValue;
		}
	}
	return best;
}

/** The match with the longest recorded duration. */
export function longestMatch(entries: GameHistoryEntry[]): GameHistoryEntry | null {
	return maxByValue(entries, (entry) => entry.durationMinutes ?? 0);
}

/** The match with the most rounds. */
export function mostRoundsMatch(entries: GameHistoryEntry[]): GameHistoryEntry | null {
	return maxByValue(entries, (entry) => entry.roundsCount);
}

/** The match with the most players at the table. */
export function largestMatch(entries: GameHistoryEntry[]): GameHistoryEntry | null {
	return maxByValue(entries, (entry) => entry.players.length);
}

/** The day with the most finished matches. */
export function busiestDay(entries: GameHistoryEntry[]): { dayIndex: number; count: number } | null {
	let best: { dayIndex: number; count: number } | null = null;
	for (const [dayIndex, count] of playCountsByDayIndex(entries)) {
		if (!best || count > best.count || (count === best.count && dayIndex > best.dayIndex)) {
			best = { dayIndex, count };
		}
	}
	return best;
}
