/**
 * Dice history: building entries from roll results, the newest-first cap,
 * filtering by die type and the counters the history section shows - above
 * all the max counter ("wie oft kam die 20 auf einem W20").
 */

jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(),
	setStorageItem: jest.fn(),
}));

import { getStorageItem } from 'repo-depkit-common-ui';
import {
	appendDiceHistoryEntry,
	buildDiceHistoryEntry,
	collectHistorySides,
	computeDiceHistoryStats,
	DICE_HISTORY_LIMIT,
	filterHistoryEntries,
	loadDiceHistory,
	type DiceHistoryEntry,
} from '../helpers/DiceHistoryStorage';

const mockGetStorageItem = getStorageItem as jest.Mock;

function entry(id: string, dice: { sides: number; value: number }[]): DiceHistoryEntry {
	return {
		id,
		rolledAt: 1000,
		mode: 'sum',
		dice,
		total: dice.reduce((sum, die) => sum + die.value, 0),
	};
}

describe('buildDiceHistoryEntry', () => {
	it('stores the rolled values of a sum roll', () => {
		const result = buildDiceHistoryEntry(
			{
				mode: 'sum',
				dice: [
					{ id: 'die-1', sides: 20, value: 20 },
					{ id: 'die-2', sides: 6, value: 3 },
				],
				total: 23,
			},
			{ id: 'entry-1', rolledAt: 42 },
		);
		expect(result).toEqual({
			id: 'entry-1',
			rolledAt: 42,
			mode: 'sum',
			dice: [
				{ sides: 20, value: 20 },
				{ sides: 6, value: 3 },
			],
			total: 23,
		});
	});

	it('stores only the kept value of an advantage/disadvantage pair', () => {
		const result = buildDiceHistoryEntry(
			{
				mode: 'advantage',
				dice: [
					{ id: 'die-1', sides: 20, valueA: 7, valueB: 18, kept: 'B' },
					{ id: 'die-2', sides: 6, valueA: 4, valueB: 2, kept: 'A' },
				],
				keptTotal: 22,
			},
			{ id: 'entry-2', rolledAt: 42 },
		);
		expect(result.dice).toEqual([
			{ sides: 20, value: 18 },
			{ sides: 6, value: 4 },
		]);
		expect(result.total).toBe(22);
	});
});

describe('appendDiceHistoryEntry', () => {
	it('prepends the new entry (newest first)', () => {
		const existing = [entry('old', [{ sides: 6, value: 2 }])];
		const next = appendDiceHistoryEntry(existing, entry('new', [{ sides: 20, value: 20 }]));
		expect(next.map((item) => item.id)).toEqual(['new', 'old']);
	});

	it('drops the oldest entries beyond the cap', () => {
		const full = Array.from({ length: DICE_HISTORY_LIMIT }, (_, index) => entry(`entry-${index}`, [{ sides: 6, value: 1 }]));
		const next = appendDiceHistoryEntry(full, entry('newest', [{ sides: 6, value: 6 }]));
		expect(next).toHaveLength(DICE_HISTORY_LIMIT);
		expect(next[0].id).toBe('newest');
		expect(next.at(-1)?.id).toBe(`entry-${DICE_HISTORY_LIMIT - 2}`);
	});
});

describe('collectHistorySides / filterHistoryEntries', () => {
	const entries = [
		entry('a', [{ sides: 20, value: 20 }, { sides: 6, value: 3 }]),
		entry('b', [{ sides: 6, value: 6 }]),
		entry('c', [{ sides: 4, value: 1 }]),
	];

	it('lists each occurring die type once, sorted ascending', () => {
		expect(collectHistorySides(entries)).toEqual([4, 6, 20]);
	});

	it('keeps entries containing at least one die of the filtered type', () => {
		expect(filterHistoryEntries(entries, 6).map((item) => item.id)).toEqual(['a', 'b']);
		expect(filterHistoryEntries(entries, 20).map((item) => item.id)).toEqual(['a']);
		expect(filterHistoryEntries(entries, null)).toHaveLength(3);
	});
});

describe('computeDiceHistoryStats', () => {
	// Three W20 rolls (20, 20, 1) plus a W6 rolling 6 and a W6 rolling 3.
	const entries = [
		entry('a', [{ sides: 20, value: 20 }, { sides: 6, value: 6 }]),
		entry('b', [{ sides: 20, value: 20 }]),
		entry('c', [{ sides: 20, value: 1 }, { sides: 6, value: 3 }]),
	];

	it('counts max rolls only for the filtered die type', () => {
		const stats = computeDiceHistoryStats(entries, 20);
		expect(stats.rollCount).toBe(3);
		expect(stats.maxCount).toBe(2);
		expect(stats.minCount).toBe(1);
		expect(stats.average).toBeCloseTo((20 + 20 + 1) / 3);
	});

	it('counts each die against its own maximum without a filter', () => {
		const stats = computeDiceHistoryStats(entries, null);
		expect(stats.rollCount).toBe(5);
		// Two natural 20s plus the W6 rolling 6.
		expect(stats.maxCount).toBe(3);
		expect(stats.minCount).toBe(1);
	});

	it('returns a null average for an empty selection', () => {
		expect(computeDiceHistoryStats([], null)).toEqual({ rollCount: 0, maxCount: 0, minCount: 0, average: null });
		expect(computeDiceHistoryStats(entries, 12).average).toBeNull();
	});
});

describe('loadDiceHistory', () => {
	it('drops malformed entries instead of failing the whole load', async () => {
		const valid = entry('ok', [{ sides: 20, value: 7 }]);
		mockGetStorageItem.mockResolvedValueOnce(
			JSON.stringify({
				entries: [
					valid,
					{ id: 'no-dice', rolledAt: 1, mode: 'sum', dice: [], total: 0 },
					{ id: 'bad-value', rolledAt: 1, mode: 'sum', dice: [{ sides: 6, value: 9 }], total: 9 },
					{ id: 'bad-mode', rolledAt: 1, mode: 'weird', dice: [{ sides: 6, value: 2 }], total: 2 },
					'garbage',
				],
			}),
		);
		await expect(loadDiceHistory()).resolves.toEqual([valid]);
	});

	it('returns an empty history for missing or unreadable data', async () => {
		mockGetStorageItem.mockResolvedValueOnce(null);
		await expect(loadDiceHistory()).resolves.toEqual([]);
		mockGetStorageItem.mockResolvedValueOnce('not json');
		await expect(loadDiceHistory()).resolves.toEqual([]);
	});
});
