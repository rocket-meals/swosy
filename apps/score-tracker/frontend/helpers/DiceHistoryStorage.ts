// Persisted history of dice rolls (dice screen) plus the pure helpers the
// screen uses to filter it by die type and to count results - e.g. how often
// a W20 actually landed its 20.
//
// Only the value that COUNTED is stored per die: in sum mode that is the
// rolled value, in advantage/disadvantage mode the kept value of the pair.
// That keeps the stats honest ("wie oft kam die 20") without re-encoding the
// whole pair semantics here.

import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { RollMode, RollResult } from './DiceRollHelper';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiceHistoryDie = {
	sides: number;
	/** The value that counted for this die (kept value in advantage/disadvantage). */
	value: number;
};

export type DiceHistoryEntry = {
	id: string;
	rolledAt: number;
	mode: RollMode;
	dice: DiceHistoryDie[];
	/** Sum of the counted values - matches what the roll screen showed as "Summe". */
	total: number;
};

/** Newest-first cap so the stored history cannot grow without bound. */
export const DICE_HISTORY_LIMIT = 200;

// ─── Building and appending entries ───────────────────────────────────────────

/**
 * Snapshot of a finished roll, ready for the history. Advantage/disadvantage
 * pairs collapse to their kept value (see module comment).
 */
export function buildDiceHistoryEntry(result: RollResult, params: { id: string; rolledAt: number }): DiceHistoryEntry {
	const dice: DiceHistoryDie[] =
		result.mode === 'sum'
			? result.dice.map((die) => ({ sides: die.sides, value: die.value }))
			: result.dice.map((die) => ({ sides: die.sides, value: die.kept === 'A' ? die.valueA : die.valueB }));
	return {
		id: params.id,
		rolledAt: params.rolledAt,
		mode: result.mode,
		dice,
		total: result.mode === 'sum' ? result.total : result.keptTotal,
	};
}

/** Prepend `entry` (history is newest-first) and drop everything beyond the cap. */
export function appendDiceHistoryEntry(entries: DiceHistoryEntry[], entry: DiceHistoryEntry): DiceHistoryEntry[] {
	return [entry, ...entries].slice(0, DICE_HISTORY_LIMIT);
}

// ─── Filtering and counting ───────────────────────────────────────────────────

/** Sorted list of die types (side counts) occurring in the history - drives the filter chips. */
export function collectHistorySides(entries: DiceHistoryEntry[]): number[] {
	const sides = new Set<number>();
	for (const entry of entries) {
		for (const die of entry.dice) sides.add(die.sides);
	}
	return [...sides].sort((a, b) => a - b);
}

/**
 * Entries shown under an active die-type filter: those containing at least one
 * die with `sides` sides. `null` means no filter.
 */
export function filterHistoryEntries(entries: DiceHistoryEntry[], sides: number | null): DiceHistoryEntry[] {
	if (sides === null) return entries;
	return entries.filter((entry) => entry.dice.some((die) => die.sides === sides));
}

export type DiceHistoryStats = {
	/** Number of individual die rolls (not entries) matching the filter. */
	rollCount: number;
	/** How often the maximum landed - value === sides, e.g. the 20 on a W20. */
	maxCount: number;
	/** How often the minimum (1) landed. */
	minCount: number;
	/** Mean counted value across the matching rolls, or null without any rolls. */
	average: number | null;
};

/**
 * Counters over the individual die rolls in the history, optionally restricted
 * to one die type (`sides`, `null` = all dice).
 */
export function computeDiceHistoryStats(entries: DiceHistoryEntry[], sides: number | null): DiceHistoryStats {
	let rollCount = 0;
	let maxCount = 0;
	let minCount = 0;
	let valueSum = 0;
	for (const entry of entries) {
		for (const die of entry.dice) {
			if (sides !== null && die.sides !== sides) continue;
			rollCount += 1;
			valueSum += die.value;
			if (die.value === die.sides) maxCount += 1;
			if (die.value === 1) minCount += 1;
		}
	}
	return {
		rollCount,
		maxCount,
		minCount,
		average: rollCount === 0 ? null : valueSum / rollCount,
	};
}

// ─── Storage access ───────────────────────────────────────────────────────────

const DICE_HISTORY_KEY = 'score-tracker-dice-history.json';

type DiceHistoryState = { entries: DiceHistoryEntry[] };

function isValidDie(die: unknown): die is DiceHistoryDie {
	if (typeof die !== 'object' || die === null) return false;
	const { sides, value } = die as Partial<DiceHistoryDie>;
	return typeof sides === 'number' && sides >= 2 && typeof value === 'number' && value >= 1 && value <= sides;
}

function isValidEntry(entry: unknown): entry is DiceHistoryEntry {
	if (typeof entry !== 'object' || entry === null) return false;
	const candidate = entry as Partial<DiceHistoryEntry>;
	return (
		typeof candidate.id === 'string' &&
		typeof candidate.rolledAt === 'number' &&
		(candidate.mode === 'sum' || candidate.mode === 'advantage' || candidate.mode === 'disadvantage') &&
		Array.isArray(candidate.dice) &&
		candidate.dice.length > 0 &&
		candidate.dice.every(isValidDie) &&
		typeof candidate.total === 'number'
	);
}

/**
 * Persist the dice history to disk.
 */
export async function saveDiceHistory(entries: DiceHistoryEntry[]): Promise<void> {
	try {
		await setStorageItem(DICE_HISTORY_KEY, JSON.stringify({ entries }));
	} catch (err) {
		console.warn('[DiceHistoryStorage] Failed to save dice history:', err);
	}
}

/**
 * Load the persisted dice history from disk, dropping anything malformed.
 */
export async function loadDiceHistory(): Promise<DiceHistoryEntry[]> {
	try {
		const raw = await getStorageItem(DICE_HISTORY_KEY);
		if (raw === null) return [];
		const parsed = JSON.parse(raw) as Partial<DiceHistoryState>;
		if (!Array.isArray(parsed.entries)) return [];
		return parsed.entries.filter(isValidEntry).slice(0, DICE_HISTORY_LIMIT);
	} catch {
		return [];
	}
}
