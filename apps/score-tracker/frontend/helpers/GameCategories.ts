// ─── Custom tracked categories ────────────────────────────────────────────────
//
// Beyond the plain per-round points, a game type can define its own set of
// things worth recording about a match - e.g. for "Villen des Wahnsinns":
// start time, end time, the resulting duration, the played map, the outcome
// and a free-text note. Categories are pure data (JSON only, same reasoning as
// GameRules): a shared/imported game preset can never bring executable logic
// along, only the value types listed in `GAME_CATEGORY_TYPES` below.
//
// A category is recorded either once per match (`scope: 'match'`) or once per
// player (`scope: 'player'`). Player-scope categories are what makes a game
// trackable *without* points at all (see `GameTypeDefinition.trackScores`):
// instead of a number, each player gets e.g. "gewonnen/verloren" plus
// "Wahnsinn: ja/nein" and a note.

/** Value types a category can hold. */
export type GameCategoryType = 'enum' | 'number' | 'date' | 'time' | 'duration' | 'text' | 'boolean';

export const GAME_CATEGORY_TYPES: GameCategoryType[] = ['enum', 'boolean', 'number', 'date', 'time', 'duration', 'text'];

export const GAME_CATEGORY_TYPE_LABELS: Record<GameCategoryType, string> = {
	enum: 'Auswahl',
	boolean: 'Ja/Nein',
	number: 'Zahl',
	date: 'Datum',
	time: 'Uhrzeit',
	duration: 'Dauer',
	text: 'Text',
};

export const GAME_CATEGORY_TYPE_HINTS: Record<GameCategoryType, string> = {
	enum: 'Feste Auswahl, z.B. gewonnen / verloren',
	boolean: 'Ja oder Nein, z.B. Wahnsinn',
	number: 'Freie Zahl, z.B. gefundene Hinweise',
	date: 'Tagesdatum, z.B. Spieltag',
	time: 'Uhrzeit, z.B. Startzeit',
	duration: 'Zeitspanne in Minuten, optional berechnet',
	text: 'Freier Text, z.B. gespielte Karte oder Notiz',
};

/** Whether a category is recorded once per match or once per player. */
export type GameCategoryScope = 'match' | 'player';

export const GAME_CATEGORY_SCOPES: GameCategoryScope[] = ['match', 'player'];

export const GAME_CATEGORY_SCOPE_LABELS: Record<GameCategoryScope, string> = {
	match: 'Partie',
	player: 'Spieler',
};

/** One selectable value of an `enum` category. */
export type GameCategoryOption = {
	id: string;
	label: string;
};

/**
 * Marks a `duration` category as derived rather than entered: its value is
 * always computed as the distance between two other categories (typically a
 * start and an end time) and can't be edited directly.
 */
export type GameCategoryComputedDuration = {
	fromCategoryId: string;
	toCategoryId: string;
};

export type GameCategory = {
	id: string;
	name: string;
	type: GameCategoryType;
	scope: GameCategoryScope;
	/** Selectable values, only read for `type: 'enum'`. */
	options?: GameCategoryOption[];
	/** Only read for `type: 'duration'`. Set = value is derived, not entered. */
	computed?: GameCategoryComputedDuration | null;
};

/**
 * A recorded value. The canonical representation per type:
 * - `enum`     → the selected `GameCategoryOption.id`
 * - `boolean`  → boolean
 * - `number`   → number
 * - `date`     → ISO day string, `YYYY-MM-DD`
 * - `time`     → `HH:MM` (24h)
 * - `duration` → whole minutes
 * - `text`     → string
 * `null` (or a missing key) always means "not recorded".
 */
export type GameCategoryValue = string | number | boolean | null;

/** categoryId → recorded value. */
export type GameCategoryValues = Record<string, GameCategoryValue>;

export const EMPTY_CATEGORY_VALUE_LABEL = '—';

// ─── Time/date primitives ─────────────────────────────────────────────────────

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_DATE_REGEX = /^\d{2}\.\d{2}\.\d{4}$/;

const MINUTES_PER_DAY = 24 * 60;

function pad2(value: number): string {
	return value < 10 ? `0${value}` : String(value);
}

/** `HH:MM` → minutes since midnight, or `null` when malformed. */
export function parseTimeToMinutes(value: string): number | null {
	if (!TIME_REGEX.test(value)) return null;
	const [hours, minutes] = value.split(':');
	return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

/** Minutes since midnight → `HH:MM` (wraps around at 24h). */
export function formatMinutesAsTime(minutes: number): string {
	const normalized = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
	return `${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}`;
}

/** Whole minutes → a readable duration, e.g. `2 h 15 min`. */
export function formatDuration(minutes: number): string {
	const total = Math.max(0, Math.round(minutes));
	const hours = Math.floor(total / 60);
	const rest = total % 60;
	if (hours === 0) return `${rest} min`;
	if (rest === 0) return `${hours} h`;
	return `${hours} h ${rest} min`;
}

/** ISO day string (`YYYY-MM-DD`) → the `DD.MM.YYYY` form used by SettingsListDate. */
export function isoDateToDisplay(value: string): string {
	if (!ISO_DATE_REGEX.test(value)) return value;
	const [year, month, day] = value.split('-');
	return `${day}.${month}.${year}`;
}

/** `DD.MM.YYYY` (SettingsListDate) → ISO day string, or `null` when malformed. */
export function displayDateToIso(value: string): string | null {
	if (!DISPLAY_DATE_REGEX.test(value)) return null;
	const [day, month, year] = value.split('.');
	return `${year}-${month}-${day}`;
}

/** Current wall-clock time as `HH:MM`, for the "Jetzt" shortcut of time inputs. */
export function timeFromTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Current day as an ISO day string, for the "Heute" shortcut of date inputs. */
export function isoDateFromTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// ─── Computed durations ───────────────────────────────────────────────────────

/**
 * Maps a value onto a common "minutes" axis so a duration can be computed
 * between two categories regardless of whether they hold times or dates.
 * Returns `null` for anything that isn't a usable point in time.
 */
function toAbsoluteMinutes(category: GameCategory | undefined, value: GameCategoryValue | undefined): number | null {
	if (!category || value == null || value === '') return null;
	switch (category.type) {
		case 'time':
			return typeof value === 'string' ? parseTimeToMinutes(value) : null;
		case 'date': {
			if (typeof value !== 'string' || !ISO_DATE_REGEX.test(value)) return null;
			const [year, month, day] = value.split('-');
			return Date.UTC(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10)) / 60000;
		}
		case 'number':
		case 'duration':
			return typeof value === 'number' ? value : null;
		default:
			return null;
	}
}

/**
 * Value of a computed `duration` category: the distance between its two source
 * categories. Two plain times that wrap past midnight (e.g. 22:30 → 01:15) are
 * treated as the same night rather than as a negative duration.
 */
export function computeDurationValue(
	category: GameCategory,
	values: GameCategoryValues,
	categories: GameCategory[],
): number | null {
	const computed = category.computed;
	if (!computed) return null;
	const fromCategory = categories.find((c) => c.id === computed.fromCategoryId);
	const toCategory = categories.find((c) => c.id === computed.toCategoryId);
	const from = toAbsoluteMinutes(fromCategory, values[computed.fromCategoryId]);
	const to = toAbsoluteMinutes(toCategory, values[computed.toCategoryId]);
	if (from == null || to == null) return null;
	let diff = to - from;
	if (diff < 0 && fromCategory?.type === 'time' && toCategory?.type === 'time') {
		diff += MINUTES_PER_DAY;
	}
	return diff < 0 ? null : diff;
}

/** True when the category's value is derived and must not be edited directly. */
export function isComputedCategory(category: GameCategory): boolean {
	return category.type === 'duration' && !!category.computed;
}

/**
 * The recorded values plus every computed category filled in. Always work
 * against this (not the raw stored values) when displaying, filtering or
 * sorting, so derived durations behave like any other value.
 */
export function resolveCategoryValues(categories: GameCategory[], values: GameCategoryValues | undefined): GameCategoryValues {
	const resolved: GameCategoryValues = { ...(values ?? {}) };
	for (const category of categories) {
		if (isComputedCategory(category)) {
			resolved[category.id] = computeDurationValue(category, resolved, categories);
		}
	}
	return resolved;
}

// ─── Display ──────────────────────────────────────────────────────────────────

/** Human-readable form of a single recorded value (`—` when not recorded). */
export function formatCategoryValue(category: GameCategory, value: GameCategoryValue | undefined): string {
	if (value == null || value === '') return EMPTY_CATEGORY_VALUE_LABEL;
	switch (category.type) {
		case 'enum': {
			const option = (category.options ?? []).find((o) => o.id === value);
			return option ? option.label : EMPTY_CATEGORY_VALUE_LABEL;
		}
		case 'boolean':
			return value ? 'Ja' : 'Nein';
		case 'number':
			return String(value);
		case 'date':
			return typeof value === 'string' ? isoDateToDisplay(value) : EMPTY_CATEGORY_VALUE_LABEL;
		case 'time':
			return typeof value === 'string' ? `${value} Uhr` : EMPTY_CATEGORY_VALUE_LABEL;
		case 'duration':
			return typeof value === 'number' ? formatDuration(value) : EMPTY_CATEGORY_VALUE_LABEL;
		case 'text':
			return String(value);
	}
}

/**
 * Compact one-line summary (`Status: Gewonnen · Dauer: 2 h 15 min`) of the
 * categories that actually have a value - used on player tiles and match rows.
 */
export function summarizeCategoryValues(
	categories: GameCategory[],
	values: GameCategoryValues | undefined,
	maxEntries = 3,
): string {
	const resolved = resolveCategoryValues(categories, values);
	const parts: string[] = [];
	for (const category of categories) {
		const value = resolved[category.id];
		if (value == null || value === '') continue;
		parts.push(`${category.name}: ${formatCategoryValue(category, value)}`);
		if (parts.length >= maxEntries) break;
	}
	return parts.join(' · ');
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

/**
 * Comparable key for a value: a number for everything ordinal, a lower-cased
 * string for text/enum labels, `null` for "not recorded" (always sorted last).
 */
export function categoryValueSortKey(category: GameCategory, value: GameCategoryValue | undefined): number | string | null {
	if (value == null || value === '') return null;
	switch (category.type) {
		case 'enum': {
			const options = category.options ?? [];
			const index = options.findIndex((o) => o.id === value);
			return index >= 0 ? index : null;
		}
		case 'boolean':
			return value ? 1 : 0;
		case 'number':
		case 'duration':
			return typeof value === 'number' ? value : null;
		case 'time':
			return typeof value === 'string' ? parseTimeToMinutes(value) : null;
		case 'date':
			return toAbsoluteMinutes(category, value);
		case 'text':
			return String(value).toLowerCase();
	}
}

/** Ascending comparison of two values of the same category; unrecorded values sort last. */
export function compareCategoryValues(
	category: GameCategory,
	a: GameCategoryValue | undefined,
	b: GameCategoryValue | undefined,
): number {
	const keyA = categoryValueSortKey(category, a);
	const keyB = categoryValueSortKey(category, b);
	if (keyA == null && keyB == null) return 0;
	if (keyA == null) return 1;
	if (keyB == null) return -1;
	if (typeof keyA === 'number' && typeof keyB === 'number') return keyA - keyB;
	return String(keyA).localeCompare(String(keyB));
}

// ─── Filtering ────────────────────────────────────────────────────────────────

/**
 * One active filter. `min`/`max` of a range filter are expressed in the
 * category's own canonical value form (ISO day, `HH:MM`, minutes, number), so
 * they can be compared through `categoryValueSortKey` like any other value.
 */
export type CategoryFilter =
	| { kind: 'enum'; optionIds: string[] }
	| { kind: 'boolean'; value: boolean }
	| { kind: 'text'; contains: string }
	| { kind: 'range'; min: GameCategoryValue; max: GameCategoryValue };

/** categoryId → active filter. A missing key means "don't filter on this category". */
export type CategoryFilters = Record<string, CategoryFilter>;

export type CategoryFilterKind = CategoryFilter['kind'];

/** Which filter shape fits a category's value type. */
export function filterKindForType(type: GameCategoryType): CategoryFilterKind {
	switch (type) {
		case 'enum':
			return 'enum';
		case 'boolean':
			return 'boolean';
		case 'text':
			return 'text';
		default:
			return 'range';
	}
}

function passesRangeFilter(category: GameCategory, value: GameCategoryValue | undefined, filter: { min: GameCategoryValue; max: GameCategoryValue }): boolean {
	const key = categoryValueSortKey(category, value);
	if (key == null) return false;
	const min = categoryValueSortKey(category, filter.min);
	const max = categoryValueSortKey(category, filter.max);
	if (min != null && typeof key === 'number' && typeof min === 'number' && key < min) return false;
	if (max != null && typeof key === 'number' && typeof max === 'number' && key > max) return false;
	return true;
}

/** Whether a single recorded value satisfies one filter. */
export function categoryValuePassesFilter(
	category: GameCategory,
	value: GameCategoryValue | undefined,
	filter: CategoryFilter,
): boolean {
	switch (filter.kind) {
		case 'enum':
			if (filter.optionIds.length === 0) return true;
			return typeof value === 'string' && filter.optionIds.includes(value);
		case 'boolean':
			return value === filter.value;
		case 'text': {
			const needle = filter.contains.trim().toLowerCase();
			if (needle === '') return true;
			return typeof value === 'string' && value.toLowerCase().includes(needle);
		}
		case 'range':
			if (filter.min == null && filter.max == null) return true;
			return passesRangeFilter(category, value, filter);
	}
}

/** True when a filter is set but doesn't actually constrain anything. */
export function isEmptyFilter(filter: CategoryFilter): boolean {
	switch (filter.kind) {
		case 'enum':
			return filter.optionIds.length === 0;
		case 'boolean':
			return false;
		case 'text':
			return filter.contains.trim() === '';
		case 'range':
			return filter.min == null && filter.max == null;
	}
}

/**
 * Whether one match passes all active filters. Match-scope categories are
 * checked against the match's own values; a player-scope category passes as
 * soon as *any* participant's value matches (e.g. "Partien, in denen jemand
 * wahnsinnig wurde").
 */
export function matchPassesFilters(params: {
	categories: GameCategory[];
	filters: CategoryFilters;
	matchValues: GameCategoryValues | undefined;
	playerValues: Record<string, GameCategoryValues> | undefined;
}): boolean {
	const { categories, filters, matchValues, playerValues } = params;
	const resolvedMatchValues = resolveCategoryValues(categories, matchValues);
	const resolvedPlayerValues = Object.entries(playerValues ?? {}).map(([, values]) => resolveCategoryValues(categories, values));

	for (const category of categories) {
		const filter = filters[category.id];
		if (!filter || isEmptyFilter(filter)) continue;
		if (category.scope === 'match') {
			if (!categoryValuePassesFilter(category, resolvedMatchValues[category.id], filter)) return false;
		} else if (!resolvedPlayerValues.some((values) => categoryValuePassesFilter(category, values[category.id], filter))) {
			return false;
		}
	}
	return true;
}

// ─── Sort selection ───────────────────────────────────────────────────────────

export type MatchSortDirection = 'asc' | 'desc';

/** How a match list is ordered. `categoryId: null` = by the date it was played. */
export type MatchSort = {
	categoryId: string | null;
	direction: MatchSortDirection;
};

export const DEFAULT_MATCH_SORT: MatchSort = { categoryId: null, direction: 'desc' };

// ─── Validation (for import) ──────────────────────────────────────────────────

function isGameCategoryOption(value: unknown): value is GameCategoryOption {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return typeof v.id === 'string' && v.id !== '' && typeof v.label === 'string';
}

function hasValidEnumOptions(v: Record<string, unknown>): boolean {
	if (v.type !== 'enum') return v.options === undefined || v.options === null || (Array.isArray(v.options) && v.options.every(isGameCategoryOption));
	if (!Array.isArray(v.options) || v.options.length === 0 || !v.options.every(isGameCategoryOption)) return false;
	const ids = new Set((v.options as GameCategoryOption[]).map((o) => o.id));
	return ids.size === v.options.length;
}

function hasValidComputed(v: Record<string, unknown>): boolean {
	if (v.computed === undefined || v.computed === null) return true;
	if (v.type !== 'duration') return false;
	if (typeof v.computed !== 'object') return false;
	const computed = v.computed as Record<string, unknown>;
	return typeof computed.fromCategoryId === 'string' && typeof computed.toCategoryId === 'string';
}

function isGameCategory(value: unknown): value is GameCategory {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	if (typeof v.id !== 'string' || v.id === '') return false;
	if (typeof v.name !== 'string') return false;
	if (typeof v.type !== 'string' || !GAME_CATEGORY_TYPES.includes(v.type as GameCategoryType)) return false;
	if (typeof v.scope !== 'string' || !GAME_CATEGORY_SCOPES.includes(v.scope as GameCategoryScope)) return false;
	if (!hasValidEnumOptions(v)) return false;
	if (!hasValidComputed(v)) return false;
	return true;
}

/**
 * Validate an imported category list. Returns it typed, or `null` if any entry
 * is malformed or two entries share an id.
 */
export function validateGameCategories(value: unknown): GameCategory[] | null {
	if (!Array.isArray(value)) return null;
	if (!value.every(isGameCategory)) return null;
	const ids = new Set((value as GameCategory[]).map((c) => c.id));
	if (ids.size !== value.length) return null;
	return value as GameCategory[];
}

// ─── Convenience ──────────────────────────────────────────────────────────────

/** The categories of one scope, in their defined order. */
export function categoriesForScope(categories: GameCategory[] | null | undefined, scope: GameCategoryScope): GameCategory[] {
	return (categories ?? []).filter((category) => category.scope === scope);
}

/**
 * Categories usable as the start/end of a computed duration: any time, date or
 * plain number category of the same scope (a match duration can't be derived
 * from per-player values and vice versa).
 */
export function durationSourceCandidates(categories: GameCategory[], category: GameCategory): GameCategory[] {
	return categories.filter(
		(candidate) =>
			candidate.id !== category.id &&
			candidate.scope === category.scope &&
			(candidate.type === 'time' || candidate.type === 'date' || candidate.type === 'number'),
	);
}
