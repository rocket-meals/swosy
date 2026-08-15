// ─── One-time migration: time categories → built-in match times ───────────────
//
// Start, end and duration used to be tracked as hand-made custom categories
// (e.g. the old "Villen des Wahnsinns" preset: Spieltag + Startzeit + Endzeit
// + computed Dauer). They are built-in fields of every match now (see
// helpers/MatchTimes), so on first launch after the change:
// - every archived match derives `startedAt`/`endedAt`/`durationMinutes` from
//   its recorded time-category values (plus the day category, when present)
// - the now-redundant time categories (start time, end time, computed
//   duration) are removed from their game types, and the migrated values are
//   dropped from the entries - a plain `date` category (like "Spieltag") is
//   kept, deleting it stays the user's call
//
// Runs exactly once, guarded by a storage flag (`runBuiltinTimesMigrationOnce`).
// The migration itself is pure and idempotent: entries that already carry a
// `startedAt` are never touched again.

import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { GameCategory, GameCategoryValues } from './GameCategories';
import { parseTimeToMinutes, resolveCategoryValues } from './GameCategories';
import type { GameHistoryEntry } from './GameHistoryStorage';
import type { GameState } from './GameStorage';
import type { GameType } from './GameTypesStorage';

const MINUTE_MS = 60000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** The ids of a game type's legacy time categories, `null` where none exists. */
export type LegacyTimeCategoryIds = {
	startTimeId: string | null;
	endTimeId: string | null;
	durationId: string | null;
	dateId: string | null;
};

/**
 * Locate the categories that used to play the role of the built-in times.
 * Preferred signal: a match-scope computed `duration` whose two sources are
 * `time` categories - that trio *is* start/end/duration by construction.
 * Without one, match-scope `time` categories are matched by name, and a
 * hand-entered `duration` category (its minutes were typed in, not derived)
 * counts as the duration - so games that only ever recorded a duration
 * migrate too, not just the full start/end setups.
 */
export function findLegacyTimeCategories(categories: GameCategory[] | null | undefined): LegacyTimeCategoryIds {
	const matchScope = (categories ?? []).filter((category) => category.scope === 'match');
	const dateId = matchScope.find((category) => category.type === 'date')?.id ?? null;

	const computedDuration = matchScope.find((category) => {
		if (category.type !== 'duration' || !category.computed) return false;
		const from = matchScope.find((c) => c.id === category.computed?.fromCategoryId);
		const to = matchScope.find((c) => c.id === category.computed?.toCategoryId);
		return from?.type === 'time' && to?.type === 'time';
	});
	if (computedDuration?.computed) {
		return {
			startTimeId: computedDuration.computed.fromCategoryId,
			endTimeId: computedDuration.computed.toCategoryId,
			durationId: computedDuration.id,
			dateId,
		};
	}

	const timeCategories = matchScope.filter((category) => category.type === 'time');
	const startTimeId = timeCategories.find((category) => /start|beginn|anfang/i.test(category.name))?.id ?? null;
	const endTimeId = timeCategories.find((category) => category.id !== startTimeId && /end/i.test(category.name))?.id ?? null;

	// Standalone duration: prefer one that is named like a duration, fall back
	// to the only duration category of the game (an unnamed second one would
	// be guesswork - better to leave it alone).
	const durationCategories = matchScope.filter((category) => category.type === 'duration');
	const durationId =
		durationCategories.find((category) => /dauer|spielzeit|l[äa]nge|duration/i.test(category.name))?.id ??
		(durationCategories.length === 1 ? durationCategories[0].id : null);

	return { startTimeId, endTimeId, durationId, dateId };
}

function hasLegacyTimeCategories(legacy: LegacyTimeCategoryIds): boolean {
	return legacy.startTimeId !== null || legacy.endTimeId !== null || legacy.durationId !== null;
}

/** Local timestamp of `HH:MM` minutes on an ISO day (`YYYY-MM-DD`). */
function timestampAt(isoDay: string, minutesOfDay: number): number {
	const [year, month, day] = isoDay.split('-');
	return new Date(
		Number.parseInt(year, 10),
		Number.parseInt(month, 10) - 1,
		Number.parseInt(day, 10),
		Math.floor(minutesOfDay / 60),
		minutesOfDay % 60,
	).getTime();
}

function isoDayOf(timestamp: number): string {
	const date = new Date(timestamp);
	const pad2 = (value: number) => (value < 10 ? `0${value}` : String(value));
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function minutesFromValue(values: GameCategoryValues, categoryId: string | null): number | null {
	if (!categoryId) return null;
	const value = values[categoryId];
	return typeof value === 'string' ? parseTimeToMinutes(value) : null;
}

/** Start, end and duration as the legacy categories recorded them. */
type LegacyTimeRange = { startedAt: number | null; endTimestamp: number | null; durationMinutes: number | null };

/**
 * Read start/end/duration out of the legacy category values, anchored on
 * `isoDay`. An end before the start is read as "crossed midnight".
 */
function readLegacyTimeRange(resolved: GameCategoryValues, legacy: LegacyTimeCategoryIds, isoDay: string): LegacyTimeRange {
	const startMinutes = minutesFromValue(resolved, legacy.startTimeId);
	const endMinutes = minutesFromValue(resolved, legacy.endTimeId);
	const durationMinutes = legacy.durationId != null && typeof resolved[legacy.durationId] === 'number' ? (resolved[legacy.durationId] as number) : null;

	const startedAt = startMinutes != null ? timestampAt(isoDay, startMinutes) : null;
	let endTimestamp = endMinutes != null ? timestampAt(isoDay, endMinutes) : null;
	if (startedAt != null && endTimestamp != null && endTimestamp < startedAt) {
		endTimestamp += DAY_MS;
	}
	return { startedAt, endTimestamp, durationMinutes };
}

/** Derive whichever of start/end/duration is missing from the two that are known. */
function completeTimeRange(range: LegacyTimeRange): LegacyTimeRange {
	let { startedAt, endTimestamp } = range;
	let { durationMinutes } = range;
	if (durationMinutes == null && startedAt != null && endTimestamp != null) {
		durationMinutes = Math.round((endTimestamp - startedAt) / MINUTE_MS);
	}
	if (startedAt == null && endTimestamp != null && durationMinutes != null) {
		startedAt = endTimestamp - durationMinutes * MINUTE_MS;
	}
	if (endTimestamp == null && startedAt != null && durationMinutes != null) {
		endTimestamp = startedAt + durationMinutes * MINUTE_MS;
	}
	return { startedAt, endTimestamp, durationMinutes };
}

/**
 * The entry's category values without the migrated time categories: keeping
 * them around as orphaned values would only resurface as duplicates if a
 * category with the same id were ever re-created.
 */
function withoutLegacyTimeValues(values: GameCategoryValues | undefined, legacy: LegacyTimeCategoryIds): GameCategoryValues {
	const categoryValues = { ...values };
	for (const key of [legacy.startTimeId, legacy.endTimeId, legacy.durationId]) {
		if (key) delete categoryValues[key];
	}
	return categoryValues;
}

/**
 * Derive the built-in times of one archived match from its legacy category
 * values. The day comes from the day category when recorded, otherwise from
 * the day the match was archived (`endedAt`); an end before the start is read
 * as "crossed midnight". Entries that already carry a `startedAt` (or record
 * none of the legacy values) come back unchanged.
 */
export function migrateHistoryEntry(
	entry: GameHistoryEntry,
	categories: GameCategory[],
	legacy: LegacyTimeCategoryIds,
): GameHistoryEntry {
	if (entry.startedAt != null) return entry;

	const resolved = resolveCategoryValues(categories, entry.categoryValues);
	const recordedDay = legacy.dateId ? resolved[legacy.dateId] : null;
	const isoDay = typeof recordedDay === 'string' && ISO_DATE_REGEX.test(recordedDay) ? recordedDay : isoDayOf(entry.endedAt);

	const { startedAt: recordedStart, endTimestamp, durationMinutes: recordedDuration } = completeTimeRange(
		readLegacyTimeRange(resolved, legacy, isoDay),
	);
	let startedAt = recordedStart;
	let durationMinutes = recordedDuration;

	if (startedAt == null && endTimestamp == null && durationMinutes == null) return entry;

	// A start after the archive moment means the day guess was one off (match
	// ended past midnight, archived on the following day).
	const endedAt = endTimestamp ?? entry.endedAt;
	if (startedAt != null && startedAt > endedAt) {
		startedAt -= DAY_MS;
	}
	// Whatever is still missing derives from the archive moment: it is when
	// "Partie beenden" was pressed, i.e. the best available end of the match.
	if (startedAt == null && durationMinutes != null) {
		startedAt = endedAt - durationMinutes * MINUTE_MS;
	}
	if (durationMinutes == null && startedAt != null && endedAt >= startedAt) {
		durationMinutes = Math.round((endedAt - startedAt) / MINUTE_MS);
	}

	const categoryValues = withoutLegacyTimeValues(entry.categoryValues, legacy);

	return {
		...entry,
		startedAt: startedAt ?? undefined,
		endedAt,
		durationMinutes: durationMinutes ?? undefined,
		categoryValues,
	};
}

/**
 * Same derivation for the match that is currently loaded (running, or a
 * finished one opened for viewing) - it lives in the game state, not the
 * history, so the entry migration alone would leave it behind. A running
 * match anchors its day guess on "now" and gets no end/duration (those are
 * stamped when it is ended); a finished one migrates like an archived entry.
 */
export function migrateActiveGameState(game: GameState, gameTypes: GameType[], now: number): GameState {
	if (game.startedAt != null || game.status === 'setup' || !game.gameTypeId) return game;
	const gameType = gameTypes.find((g) => g.id === game.gameTypeId);
	const legacy = findLegacyTimeCategories(gameType?.categories);
	if (!hasLegacyTimeCategories(legacy)) return game;

	const pseudoEntry: GameHistoryEntry = {
		id: game.matchId ?? 'active',
		endedAt: game.endedAt ?? now,
		roundsCount: 0,
		players: [],
		finalScores: {},
		categoryValues: game.categoryValues,
	};
	const migrated = migrateHistoryEntry(pseudoEntry, gameType?.categories ?? [], legacy);
	if (migrated === pseudoEntry) return game;

	const isFinished = game.endedAt != null;
	return {
		...game,
		startedAt: migrated.startedAt,
		endedAt: isFinished ? migrated.endedAt : undefined,
		durationMinutes: isFinished ? migrated.durationMinutes : undefined,
		categoryValues: migrated.categoryValues,
	};
}

/**
 * Migrate every archived match and strip the legacy time categories from the
 * game types. Pure - callers persist the returned arrays themselves.
 */
export function migrateBuiltinMatchTimes(
	gameTypes: GameType[],
	entries: GameHistoryEntry[],
): { gameTypes: GameType[]; entries: GameHistoryEntry[]; changed: boolean } {
	let changed = false;
	let migratedEntries = entries;
	const migratedGameTypes = gameTypes.map((gameType) => {
		const legacy = findLegacyTimeCategories(gameType.categories);
		if (!hasLegacyTimeCategories(legacy)) return gameType;
		changed = true;

		const categories = gameType.categories ?? [];
		migratedEntries = migratedEntries.map((entry) =>
			entry.gameTypeId === gameType.id ? migrateHistoryEntry(entry, categories, legacy) : entry,
		);

		const removedIds = new Set([legacy.startTimeId, legacy.endTimeId, legacy.durationId].filter((id): id is string => id !== null));
		return {
			...gameType,
			categories: categories.filter((category) => !removedIds.has(category.id)),
		};
	});

	return changed
		? { gameTypes: migratedGameTypes, entries: migratedEntries, changed }
		: { gameTypes, entries, changed };
}

// ─── One-time execution guard ─────────────────────────────────────────────────

const MIGRATION_FLAG_KEY = 'score-tracker-builtin-times-migration.json';

/**
 * Bump when the migration learns to derive more (a device that already ran an
 * older version then runs the new one once more - safe, the migration is
 * idempotent). v2: standalone duration categories, missing-piece fallbacks
 * via the archive moment, and the currently loaded match.
 */
const MIGRATION_VERSION = 2;

/**
 * Run the migration exactly once per installation (per `MIGRATION_VERSION`):
 * the flag is written after the run, every later launch passes the data
 * through untouched. Called at startup between loading and dispatching game
 * state + game types + history - the store dispatch of the migrated data
 * persists it via the regular auto-save.
 */
export async function runBuiltinTimesMigrationOnce(
	gameTypes: GameType[],
	entries: GameHistoryEntry[],
	gameState: GameState,
): Promise<{ gameTypes: GameType[]; entries: GameHistoryEntry[]; gameState: GameState }> {
	try {
		const flag = await getStorageItem(MIGRATION_FLAG_KEY);
		if (flag !== null) {
			const parsed = JSON.parse(flag) as { version?: number };
			if ((parsed.version ?? 1) >= MIGRATION_VERSION) return { gameTypes, entries, gameState };
		}
	} catch {
		// Unreadable flag: fall through and run - the migration is idempotent.
	}
	// The loaded match needs the legacy categories still in place, so it
	// migrates before they are stripped from the game types.
	const migratedGameState = migrateActiveGameState(gameState, gameTypes, Date.now());
	const result = migrateBuiltinMatchTimes(gameTypes, entries);
	try {
		await setStorageItem(MIGRATION_FLAG_KEY, JSON.stringify({ version: MIGRATION_VERSION, migratedAt: Date.now() }));
	} catch (err) {
		console.warn('[BuiltinTimesMigration] Failed to persist migration flag:', err);
	}
	return { gameTypes: result.gameTypes, entries: result.entries, gameState: migratedGameState };
}
