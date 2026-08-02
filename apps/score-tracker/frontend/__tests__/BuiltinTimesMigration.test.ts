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

import {
	findLegacyTimeCategories,
	migrateActiveGameState,
	migrateBuiltinMatchTimes,
	migrateHistoryEntry,
} from '../helpers/BuiltinTimesMigration';
import type { GameCategory } from '../helpers/GameCategories';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
import type { GameState } from '../helpers/GameStorage';
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

	it('finds a standalone hand-entered duration category', () => {
		const categories: GameCategory[] = [{ id: 'dur', name: 'Spieldauer', type: 'duration', scope: 'match' }];
		expect(findLegacyTimeCategories(categories)).toEqual({ startTimeId: null, endTimeId: null, durationId: 'dur', dateId: null });
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

	it('derives start and duration from a lone start time via the archive moment', () => {
		// Archived (= "Partie beenden") at 22:00 with only a 19:30 start
		// recorded: the archive moment is the best available end.
		const entry = makeEntry({
			endedAt: new Date(2024, 4, 1, 22, 0).getTime(),
			categoryValues: { startTime: '19:30' },
		});
		const migrated = migrateHistoryEntry(entry, LEGACY_CATEGORIES, LEGACY_IDS);
		expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 19, 30).getTime());
		expect(migrated.endedAt).toBe(entry.endedAt);
		expect(migrated.durationMinutes).toBe(150);
	});

	it('derives the start from a standalone hand-entered duration', () => {
		const categories: GameCategory[] = [{ id: 'dur', name: 'Dauer', type: 'duration', scope: 'match' }];
		const legacy = findLegacyTimeCategories(categories);
		const entry = makeEntry({ endedAt: new Date(2024, 4, 1, 22, 0).getTime(), categoryValues: { dur: 120 } });
		const migrated = migrateHistoryEntry(entry, categories, legacy);
		expect(migrated.durationMinutes).toBe(120);
		expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 20, 0).getTime());
		expect(migrated.endedAt).toBe(entry.endedAt);
		expect(migrated.categoryValues).toEqual({});
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

	describe('migrateActiveGameState', () => {
		const NOW = new Date(2024, 4, 1, 20, 0).getTime();

		function makeGame(overrides: Partial<GameState>): GameState {
			return {
				players: [],
				rounds: [],
				status: 'active',
				currentRoundIndex: 0,
				matchId: 'match-1',
				gameTypeId: 'game-1',
				categoryValues: {},
				playerCategoryValues: {},
				...overrides,
			};
		}

		const gameTypes = [makeGameType('game-1', LEGACY_CATEGORIES)];

		it('derives the running match start from its recorded values (anchored on now)', () => {
			const game = makeGame({ categoryValues: { startTime: '19:30', map: 'Haus Lynch' } });
			const migrated = migrateActiveGameState(game, gameTypes, NOW);
			expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 19, 30).getTime());
			// A running match gets no end/duration - those are stamped on ending.
			expect(migrated.endedAt).toBeUndefined();
			expect(migrated.durationMinutes).toBeUndefined();
			expect(migrated.categoryValues).toEqual({ map: 'Haus Lynch' });
		});

		it('migrates a finished (view-only) loaded match like an archived entry', () => {
			const game = makeGame({
				status: 'finished',
				endedAt: new Date(2024, 4, 1, 23, 0).getTime(),
				categoryValues: { date: '2024-05-01', startTime: '19:30', endTime: '22:45' },
			});
			const migrated = migrateActiveGameState(game, gameTypes, NOW);
			expect(migrated.startedAt).toBe(new Date(2024, 4, 1, 19, 30).getTime());
			expect(migrated.endedAt).toBe(new Date(2024, 4, 1, 22, 45).getTime());
			expect(migrated.durationMinutes).toBe(195);
		});

		it.each([
			['a match in the setup phase', { status: 'setup' as const, categoryValues: { startTime: '19:30' } }],
			['a match that already has a start', { startedAt: 123, categoryValues: { startTime: '19:30' } }],
			['a match without recorded time values', { categoryValues: {} }],
			['a match without a game type', { gameTypeId: undefined, categoryValues: { startTime: '19:30' } }],
		])('leaves %s untouched', (_name, overrides) => {
			const game = makeGame(overrides);
			expect(migrateActiveGameState(game, gameTypes, NOW)).toBe(game);
		});
	});
});
