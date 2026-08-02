/**
 * Unit tests for the one-time migration of legacy time categories (Spieltag /
 * Startzeit / Endzeit / computed Dauer) into the built-in match times - see
 * helpers/BuiltinTimesMigration.
 */

// The migration module imports the storage functions from common-ui for its
// one-time flag; mocking the package keeps jest away from expo-sqlite.
jest.mock('repo-depkit-common-ui', () => ({
	getStorageItem: jest.fn(async () => null),
	setStorageItem: jest.fn(async () => undefined),
}));

import { findLegacyTimeCategories, migrateBuiltinMatchTimes, migrateHistoryEntry } from '../helpers/BuiltinTimesMigration';
import type { GameCategory } from '../helpers/GameCategories';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
import type { GameType } from '../helpers/GameTypesStorage';

/** The category layout of the old "Villen des Wahnsinns" preset. */
const LEGACY_CATEGORIES: GameCategory[] = [
	{ id: 'date', name: 'Spieltag', type: 'date', scope: 'match' },
	{ id: 'startTime', name: 'Startzeit', type: 'time', scope: 'match' },
	{ id: 'endTime', name: 'Endzeit', type: 'time', scope: 'match' },
	{ id: 'duration', name: 'Dauer', type: 'duration', scope: 'match', computed: { fromCategoryId: 'startTime', toCategoryId: 'endTime' } },
	{ id: 'map', name: 'Gespielte Karte', type: 'text', scope: 'match' },
	{ id: 'insanity', name: 'Wahnsinn', type: 'boolean', scope: 'player' },
];

const LEGACY_IDS = findLegacyTimeCategories(LEGACY_CATEGORIES);

function makeEntry(overrides: Partial<GameHistoryEntry>): GameHistoryEntry {
	return {
		id: 'match-1',
		endedAt: new Date(2024, 4, 1, 23, 0).getTime(),
		roundsCount: 0,
		players: [],
		finalScores: {},
		gameTypeId: 'game-1',
		...overrides,
	};
}

describe('findLegacyTimeCategories', () => {
	it('finds the computed-duration trio plus the day category', () => {
		expect(LEGACY_IDS).toEqual({ startTimeId: 'startTime', endTimeId: 'endTime', durationId: 'duration', dateId: 'date' });
	});

	it('falls back to name matching without a computed duration', () => {
		const categories: GameCategory[] = [
			{ id: 'a', name: 'Startzeit', type: 'time', scope: 'match' },
			{ id: 'b', name: 'Endzeit', type: 'time', scope: 'match' },
		];
		expect(findLegacyTimeCategories(categories)).toEqual({ startTimeId: 'a', endTimeId: 'b', durationId: null, dateId: null });
	});

	it('finds nothing in a game without time categories', () => {
		const categories: GameCategory[] = [{ id: 'map', name: 'Gespielte Karte', type: 'text', scope: 'match' }];
		expect(findLegacyTimeCategories(categories)).toEqual({ startTimeId: null, endTimeId: null, durationId: null, dateId: null });
	});
});

describe('migrateHistoryEntry', () => {
	it('derives start, end and duration from day + times and strips the migrated values', () => {
		const entry = makeEntry({
			categoryValues: { date: '2024-05-01', startTime: '19:30', endTime: '22:45', map: 'Haus Lynch' },
		});
		const migrated = migrateHistoryEntry(entry, LEGACY_CATEGORIES, LEGACY_IDS);
		expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 19, 30).getTime());
		expect(migrated.endedAt).toBe(new Date(2024, 4, 1, 22, 45).getTime());
		expect(migrated.durationMinutes).toBe(195);
		// The day category survives (it stays a normal category), the time
		// values move into the built-in fields.
		expect(migrated.categoryValues).toEqual({ date: '2024-05-01', map: 'Haus Lynch' });
	});

	it('treats an end before the start as crossing midnight', () => {
		const entry = makeEntry({
			endedAt: new Date(2024, 4, 2, 1, 30).getTime(),
			categoryValues: { date: '2024-05-01', startTime: '22:30', endTime: '01:15' },
		});
		const migrated = migrateHistoryEntry(entry, LEGACY_CATEGORIES, LEGACY_IDS);
		expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 22, 30).getTime());
		expect(migrated.endedAt).toBe(new Date(2024, 4, 2, 1, 15).getTime());
		expect(migrated.durationMinutes).toBe(165);
	});

	it('falls back to the archive day when no day category was recorded', () => {
		const entry = makeEntry({ categoryValues: { startTime: '19:30', endTime: '21:00' } });
		const migrated = migrateHistoryEntry(entry, LEGACY_CATEGORIES, LEGACY_IDS);
		expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 19, 30).getTime());
		expect(migrated.durationMinutes).toBe(90);
	});

	it('shifts a start that would lie after the archive moment back by a day', () => {
		// Archived at 00:30, started 23:00 "the same day" per fallback → the
		// match actually started the evening before.
		const entry = makeEntry({
			endedAt: new Date(2024, 4, 2, 0, 30).getTime(),
			categoryValues: { startTime: '23:00' },
		});
		const migrated = migrateHistoryEntry(entry, LEGACY_CATEGORIES, LEGACY_IDS);
		expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 23, 0).getTime());
		expect(migrated.durationMinutes).toBe(90);
	});

	it('leaves an already migrated entry untouched', () => {
		const entry = makeEntry({ startedAt: 123, categoryValues: { startTime: '19:30' } });
		expect(migrateHistoryEntry(entry, LEGACY_CATEGORIES, LEGACY_IDS)).toBe(entry);
	});

	it('leaves an entry without any recorded time values untouched', () => {
		const entry = makeEntry({ categoryValues: { map: 'Haus Lynch' } });
		expect(migrateHistoryEntry(entry, LEGACY_CATEGORIES, LEGACY_IDS)).toBe(entry);
	});
});

describe('migrateBuiltinMatchTimes', () => {
	function makeGameType(id: string, categories: GameCategory[] | null): GameType {
		return {
			id,
			name: 'Villen des Wahnsinns',
			icon: '🏰',
			imageUrl: null,
			scoringMode: 'highWins',
			maxRounds: null,
			maxScore: null,
			rules: null,
			categories,
			trackScores: false,
			version: 1,
			createdAt: 0,
		};
	}

	it('migrates matching entries and removes the legacy time categories from the game type', () => {
		const gameType = makeGameType('game-1', LEGACY_CATEGORIES);
		const otherGameType = makeGameType('game-2', null);
		const entry = makeEntry({ categoryValues: { date: '2024-05-01', startTime: '19:30', endTime: '22:45' } });
		const foreignEntry = makeEntry({ id: 'match-2', gameTypeId: 'game-2' });

		const result = migrateBuiltinMatchTimes([gameType, otherGameType], [entry, foreignEntry]);
		expect(result.changed).toBe(true);
		expect(result.gameTypes[0].categories?.map((c) => c.id)).toEqual(['date', 'map', 'insanity']);
		expect(result.gameTypes[1]).toBe(otherGameType);
		expect(result.entries[0].startedAt).toBe(new Date(2024, 4, 1, 19, 30).getTime());
		expect(result.entries[1]).toBe(foreignEntry);
	});

	it('changes nothing when no game type carries legacy time categories', () => {
		const gameType = makeGameType('game-1', [{ id: 'map', name: 'Gespielte Karte', type: 'text', scope: 'match' }]);
		const entries = [makeEntry({})];
		const result = migrateBuiltinMatchTimes([gameType], entries);
		expect(result.changed).toBe(false);
		expect(result.entries).toBe(entries);
	});
});
