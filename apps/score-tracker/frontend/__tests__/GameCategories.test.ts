/**
 * Unit tests for the custom category system (helpers/GameCategories): the
 * derived-duration computation, value formatting, sorting and the filter
 * predicates the game detail screen's match list runs on, plus the import
 * validation that keeps a shared game preset's categories trustworthy.
 */

import type { GameCategory } from '../helpers/GameCategories';
import {
	categoryValuePassesFilter,
	compareCategoryValues,
	computeDurationValue,
	formatCategoryValue,
	formatDuration,
	matchPassesFilters,
	parseTimeToMinutes,
	resolveCategoryValues,
	summarizeCategoryValues,
	cloneGameCategories,
	normalizeGameCategories,
} from '../helpers/GameCategories';
import { MANSIONS_OF_MADNESS_PRESET, parseGamePreset } from '../helpers/GameRules';

const startTime: GameCategory = { id: 'start', name: 'Startzeit', type: 'time', scope: 'match' };
const endTime: GameCategory = { id: 'end', name: 'Endzeit', type: 'time', scope: 'match' };
const duration: GameCategory = {
	id: 'duration',
	name: 'Dauer',
	type: 'duration',
	scope: 'match',
	computed: { fromCategoryId: 'start', toCategoryId: 'end' },
};
const status: GameCategory = {
	id: 'status',
	name: 'Spielstatus',
	type: 'enum',
	scope: 'match',
	options: [
		{ id: 'won', label: 'Gewonnen' },
		{ id: 'lost', label: 'Verloren' },
	],
};
const note: GameCategory = { id: 'note', name: 'Notiz', type: 'text', scope: 'match' };
const insanity: GameCategory = { id: 'insanity', name: 'Wahnsinn', type: 'boolean', scope: 'player' };

const CATEGORIES = [startTime, endTime, duration, status, note, insanity];

describe('computeDurationValue', () => {
	it('derives the duration between two times', () => {
		expect(computeDurationValue(duration, { start: '19:30', end: '22:15' }, CATEGORIES)).toBe(165);
	});

	it('treats a pair of times wrapping past midnight as the same night', () => {
		expect(computeDurationValue(duration, { start: '22:30', end: '01:15' }, CATEGORIES)).toBe(165);
	});

	it('is null while one of the two source values is missing', () => {
		expect(computeDurationValue(duration, { start: '19:30' }, CATEGORIES)).toBeNull();
		expect(computeDurationValue(duration, {}, CATEGORIES)).toBeNull();
	});

	it('spans days when derived from date categories', () => {
		const from: GameCategory = { id: 'from', name: 'Von', type: 'date', scope: 'match' };
		const to: GameCategory = { id: 'to', name: 'Bis', type: 'date', scope: 'match' };
		const dayDuration: GameCategory = {
			id: 'days',
			name: 'Dauer',
			type: 'duration',
			scope: 'match',
			computed: { fromCategoryId: 'from', toCategoryId: 'to' },
		};
		const minutes = computeDurationValue(dayDuration, { from: '2026-07-01', to: '2026-07-03' }, [from, to, dayDuration]);
		expect(minutes).toBe(2 * 24 * 60);
	});
});

describe('resolveCategoryValues', () => {
	it('fills in computed categories without touching the entered ones', () => {
		const resolved = resolveCategoryValues(CATEGORIES, { start: '19:00', end: '20:30', status: 'won' });
		expect(resolved.duration).toBe(90);
		expect(resolved.start).toBe('19:00');
		expect(resolved.status).toBe('won');
	});
});

describe('formatting', () => {
	it('formats every value type readably', () => {
		expect(formatCategoryValue(status, 'won')).toBe('Gewonnen');
		expect(formatCategoryValue(status, 'unknown-option')).toBe('—');
		expect(formatCategoryValue(insanity, true)).toBe('Ja');
		expect(formatCategoryValue(insanity, false)).toBe('Nein');
		expect(formatCategoryValue(startTime, '19:05')).toBe('19:05 Uhr');
		expect(formatCategoryValue(duration, 165)).toBe('2 h 45 min');
		expect(formatCategoryValue(note, 'Zwei Hinweise verpasst')).toBe('Zwei Hinweise verpasst');
		expect(formatCategoryValue({ id: 'd', name: 'Tag', type: 'date', scope: 'match' }, '2026-07-26')).toBe('26.07.2026');
		expect(formatCategoryValue(note, null)).toBe('—');
	});

	it('formats durations in hours and minutes', () => {
		expect(formatDuration(45)).toBe('45 min');
		expect(formatDuration(120)).toBe('2 h');
		expect(formatDuration(0)).toBe('0 min');
	});

	it('parses times and rejects malformed ones', () => {
		expect(parseTimeToMinutes('07:45')).toBe(465);
		expect(parseTimeToMinutes('7:45')).toBeNull();
		expect(parseTimeToMinutes('25:00')).toBeNull();
	});

	it('summarizes only the values that were actually recorded', () => {
		const summary = summarizeCategoryValues([startTime, endTime, duration, status], {
			start: '19:00',
			end: '20:30',
			status: 'won',
		});
		expect(summary).toBe('Startzeit: 19:00 Uhr · Endzeit: 20:30 Uhr · Dauer: 1 h 30 min');
		expect(summarizeCategoryValues([status, note], {})).toBe('');
	});
});

describe('compareCategoryValues', () => {
	it('orders by the category-specific value, unrecorded values last', () => {
		expect(compareCategoryValues(duration, 90, 120)).toBeLessThan(0);
		expect(compareCategoryValues(startTime, '22:00', '09:00')).toBeGreaterThan(0);
		expect(compareCategoryValues(note, 'alpha', 'beta')).toBeLessThan(0);
		expect(compareCategoryValues(duration, null, 5)).toBeGreaterThan(0);
		expect(compareCategoryValues(duration, 5, null)).toBeLessThan(0);
		expect(compareCategoryValues(duration, null, null)).toBe(0);
	});

	it('orders enum values by the order their options are defined in', () => {
		expect(compareCategoryValues(status, 'won', 'lost')).toBeLessThan(0);
	});
});

describe('categoryValuePassesFilter', () => {
	it('matches any of the selected enum options', () => {
		expect(categoryValuePassesFilter(status, 'won', { kind: 'enum', optionIds: ['won', 'lost'] })).toBe(true);
		expect(categoryValuePassesFilter(status, 'lost', { kind: 'enum', optionIds: ['won'] })).toBe(false);
		expect(categoryValuePassesFilter(status, null, { kind: 'enum', optionIds: ['won'] })).toBe(false);
	});

	it('matches booleans exactly', () => {
		expect(categoryValuePassesFilter(insanity, true, { kind: 'boolean', value: true })).toBe(true);
		expect(categoryValuePassesFilter(insanity, undefined, { kind: 'boolean', value: false })).toBe(false);
	});

	it('matches text case-insensitively as a substring', () => {
		expect(categoryValuePassesFilter(note, 'Zwei Hinweise', { kind: 'text', contains: 'hinweise' })).toBe(true);
		expect(categoryValuePassesFilter(note, 'Zwei Hinweise', { kind: 'text', contains: 'karte' })).toBe(false);
	});

	it('applies range bounds in the category\'s own value form', () => {
		expect(categoryValuePassesFilter(duration, 120, { kind: 'range', min: 90, max: null })).toBe(true);
		expect(categoryValuePassesFilter(duration, 60, { kind: 'range', min: 90, max: null })).toBe(false);
		expect(categoryValuePassesFilter(startTime, '19:00', { kind: 'range', min: '18:00', max: '20:00' })).toBe(true);
		expect(categoryValuePassesFilter(startTime, '21:00', { kind: 'range', min: '18:00', max: '20:00' })).toBe(false);
		// An unrecorded value can never satisfy an active range.
		expect(categoryValuePassesFilter(duration, null, { kind: 'range', min: 1, max: null })).toBe(false);
	});
});

describe('matchPassesFilters', () => {
	const matchValues = { start: '19:00', end: '21:30', status: 'won', note: 'Karte 2' };
	const playerValues = { p1: { insanity: false }, p2: { insanity: true } };

	it('passes when no filter is set', () => {
		expect(matchPassesFilters({ categories: CATEGORIES, filters: {}, matchValues, playerValues })).toBe(true);
	});

	it('filters on a computed duration just like an entered value', () => {
		expect(
			matchPassesFilters({
				categories: CATEGORIES,
				filters: { duration: { kind: 'range', min: 120, max: null } },
				matchValues,
				playerValues,
			}),
		).toBe(true);
		expect(
			matchPassesFilters({
				categories: CATEGORIES,
				filters: { duration: { kind: 'range', min: null, max: 60 } },
				matchValues,
				playerValues,
			}),
		).toBe(false);
	});

	it('passes a player-scope filter as soon as one participant matches', () => {
		expect(
			matchPassesFilters({
				categories: CATEGORIES,
				filters: { insanity: { kind: 'boolean', value: true } },
				matchValues,
				playerValues,
			}),
		).toBe(true);
		expect(
			matchPassesFilters({
				categories: CATEGORIES,
				filters: { insanity: { kind: 'boolean', value: true } },
				matchValues,
				playerValues: { p1: { insanity: false } },
			}),
		).toBe(false);
	});

	it('requires every active filter to match', () => {
		expect(
			matchPassesFilters({
				categories: CATEGORIES,
				filters: { status: { kind: 'enum', optionIds: ['won'] }, note: { kind: 'text', contains: 'karte 3' } },
				matchValues,
				playerValues,
			}),
		).toBe(false);
	});

	it('ignores a filter that does not constrain anything', () => {
		expect(
			matchPassesFilters({
				categories: CATEGORIES,
				filters: { status: { kind: 'enum', optionIds: [] }, note: { kind: 'text', contains: '  ' } },
				matchValues,
				playerValues,
			}),
		).toBe(true);
	});
});

describe('normalizeGameCategories', () => {
	it('accepts a well-formed list and keeps every id it was given', () => {
		const normalized = normalizeGameCategories([startTime, duration, status]);
		expect(normalized?.map((c) => c.id)).toEqual(['start', 'duration', 'status']);
		expect(normalized?.[2].options?.map((o) => o.id)).toEqual(['won', 'lost']);
	});

	it('generates ids for categories and options that have none', () => {
		const normalized = normalizeGameCategories([
			{ name: 'Notiz', type: 'text', scope: 'match' },
			{ name: 'Ergebnis', type: 'enum', scope: 'player', options: [{ label: 'Gewonnen' }, { label: 'Verloren' }] },
		]);
		expect(normalized).not.toBeNull();
		const [note0, outcome] = normalized!;
		expect(note0.id).toBeTruthy();
		expect(outcome.id).toBeTruthy();
		expect(note0.id).not.toBe(outcome.id);
		const optionIds = outcome.options!.map((o) => o.id);
		expect(optionIds.every((id) => typeof id === 'string' && id !== '')).toBe(true);
		expect(new Set(optionIds).size).toBe(2);
	});

	it('resolves a computed duration that references its sources by name', () => {
		const normalized = normalizeGameCategories([
			{ name: 'Startzeit', type: 'time', scope: 'match' },
			{ name: 'Endzeit', type: 'time', scope: 'match' },
			{ name: 'Dauer', type: 'duration', scope: 'match', computed: { fromCategoryId: 'Startzeit', toCategoryId: 'Endzeit' } },
		]);
		const [from, to, computed] = normalized!;
		expect(computed.computed).toEqual({ fromCategoryId: from.id, toCategoryId: to.id });
	});

	it('drops a computed link that points at nothing instead of failing the import', () => {
		const normalized = normalizeGameCategories([
			{ id: 'd', name: 'Dauer', type: 'duration', scope: 'match', computed: { fromCategoryId: 'weg', toCategoryId: 'auch-weg' } },
		]);
		expect(normalized?.[0].computed).toBeNull();
	});

	it('rejects malformed entries', () => {
		expect(normalizeGameCategories('nope')).toBeNull();
		expect(normalizeGameCategories([{ id: 'x', name: 'X', type: 'unknown', scope: 'match' }])).toBeNull();
		expect(normalizeGameCategories([{ id: 'x', name: 'X', type: 'text', scope: 'nowhere' }])).toBeNull();
		// enum without anything to select, and duplicate explicit ids
		expect(normalizeGameCategories([{ id: 'x', name: 'X', type: 'enum', scope: 'match' }])).toBeNull();
		expect(normalizeGameCategories([startTime, { ...endTime, id: startTime.id }])).toBeNull();
	});
});

describe('cloneGameCategories', () => {
	it('copies nested options so two game types never share them', () => {
		const clone = cloneGameCategories([status])!;
		expect(clone[0]).not.toBe(status);
		expect(clone[0].options![0]).not.toBe(status.options![0]);
		expect(clone[0].options![0].id).toBe(status.options![0].id);
		clone[0].options![0].label = 'Geschafft';
		expect(status.options![0].label).toBe('Gewonnen');
	});
});

// The whole point of storing ids: a match records `{ status: 'won' }` and the
// label is resolved from the game type at display time - so renaming a category
// or an option rewrites what past matches show, without rewriting their data.
describe('id-based storage', () => {
	it('reflects a renamed option in an already recorded value', () => {
		const recorded = { status: 'won' };
		expect(formatCategoryValue(status, recorded.status)).toBe('Gewonnen');

		const renamed: GameCategory = {
			...status,
			name: 'Ausgang',
			options: [
				{ id: 'won', label: 'Erfolgreich geflohen' },
				{ id: 'lost', label: 'Verloren' },
			],
		};
		// Same stored value, new label - nothing about the match had to change.
		expect(formatCategoryValue(renamed, recorded.status)).toBe('Erfolgreich geflohen');
		expect(summarizeCategoryValues([renamed], recorded)).toBe('Ausgang: Erfolgreich geflohen');
	});

	it('keeps filtering and sorting working after a rename', () => {
		const renamed: GameCategory = { ...status, options: [{ id: 'won', label: 'Sieg' }, { id: 'lost', label: 'Pleite' }] };
		expect(categoryValuePassesFilter(renamed, 'won', { kind: 'enum', optionIds: ['won'] })).toBe(true);
		expect(compareCategoryValues(renamed, 'won', 'lost')).toBeLessThan(0);
	});

	it('shows a value whose option was deleted as "not recorded" without losing the stored id', () => {
		const recorded = { status: 'won' };
		const withoutWon: GameCategory = { ...status, options: [{ id: 'lost', label: 'Verloren' }] };
		expect(formatCategoryValue(withoutWon, recorded.status)).toBe('—');
		// The match still holds the id, so re-adding the option restores the display.
		expect(recorded.status).toBe('won');
		expect(formatCategoryValue(status, recorded.status)).toBe('Gewonnen');
	});
});

describe('game preset round-trip', () => {
	it('keeps categories and trackScores across export/import', () => {
		const parsed = parseGamePreset(JSON.stringify(MANSIONS_OF_MADNESS_PRESET));
		expect(parsed).not.toBeNull();
		expect(parsed?.trackScores).toBe(false);
		expect(parsed?.categories?.map((c) => c.id)).toEqual(MANSIONS_OF_MADNESS_PRESET.categories?.map((c) => c.id));
	});

	it('defaults trackScores to true when a preset does not mention it', () => {
		const parsed = parseGamePreset(JSON.stringify({ name: 'Skat', icon: '🃏', scoringMode: 'highWins' }));
		expect(parsed?.trackScores).toBe(true);
		expect(parsed?.categories).toBeNull();
	});

	it('rejects a preset whose categories are malformed', () => {
		const parsed = parseGamePreset(
			JSON.stringify({ name: 'Kaputt', icon: '🃏', scoringMode: 'highWins', categories: [{ id: 'a' }] }),
		);
		expect(parsed).toBeNull();
	});
});
