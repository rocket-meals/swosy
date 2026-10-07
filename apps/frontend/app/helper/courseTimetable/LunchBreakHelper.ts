/**
 * Lunch break suggestion for the course timetable.
 *
 * Rules (in this order):
 * 1. Take the opening hours of the user's canteen on that date (food service hours,
 *    falling back to the building's business hours).
 * 2. Only suggest anything when the canteen offers at least one food that day – checked by
 *    the caller, which also picks the food.
 * 3. Within the opening hours, find the largest uninterrupted block that no event of the day
 *    touches (an event in the middle splits the opening hours, one running into it shortens it).
 * 4. Suggest that block only if it is at least {@link MIN_LUNCH_BREAK_MINUTES} long.
 *
 * Everything here is pure so it can be unit-tested; times are minutes since midnight.
 */

import { timeToMinutes, type CourseTimetableWeekday } from './CourseTimetableModel';

export const MIN_LUNCH_BREAK_MINUTES = 30;

export type MinuteRange = { start: number; end: number };

/** The subset of a `businesshours` row this helper reads. */
export type BusinessHoursLike = {
	status?: string | null;
	time_start?: string | null;
	time_end?: string | null;
	date_valid_from?: string | null;
	date_valid_till?: string | null;
} & Partial<Record<CourseTimetableWeekday, boolean | null>>;

/** Sorts and merges overlapping or touching ranges. */
export function mergeRanges(ranges: MinuteRange[]): MinuteRange[] {
	const sorted = ranges.filter(range => range.end > range.start).sort((a, b) => a.start - b.start);
	const merged: MinuteRange[] = [];
	for (const range of sorted) {
		const last = merged[merged.length - 1];
		if (last && range.start <= last.end) {
			last.end = Math.max(last.end, range.end);
		} else {
			merged.push({ ...range });
		}
	}
	return merged;
}

/**
 * Opening ranges of the given business hours on one date.
 *
 * @param dateString local day as `YYYY-MM-DD`
 */
export function getOpeningRangesForDate(businessHours: BusinessHoursLike[], dateString: string, weekday: CourseTimetableWeekday): MinuteRange[] {
	const ranges: MinuteRange[] = [];
	for (const hours of businessHours) {
		if (!hours) continue;
		if (hours.status && hours.status !== 'published') continue;
		if (hours[weekday] !== true) continue;
		if (hours.date_valid_from && dateString < hours.date_valid_from.slice(0, 10)) continue;
		if (hours.date_valid_till && dateString > hours.date_valid_till.slice(0, 10)) continue;
		if (!hours.time_start || !hours.time_end) continue;
		const start = timeToMinutes(hours.time_start);
		const end = timeToMinutes(hours.time_end);
		if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
		ranges.push({ start, end });
	}
	return mergeRanges(ranges);
}

/** Free sub-ranges of `opening` once all `busy` ranges are cut out. */
export function subtractRanges(opening: MinuteRange[], busy: MinuteRange[]): MinuteRange[] {
	const mergedBusy = mergeRanges(busy);
	const free: MinuteRange[] = [];
	for (const range of mergeRanges(opening)) {
		let cursor = range.start;
		for (const block of mergedBusy) {
			if (block.end <= cursor || block.start >= range.end) continue;
			if (block.start > cursor) free.push({ start: cursor, end: block.start });
			cursor = Math.max(cursor, block.end);
			if (cursor >= range.end) break;
		}
		if (cursor < range.end) free.push({ start: cursor, end: range.end });
	}
	return free;
}

/**
 * The largest free block within the opening hours, or null when there is none of at least
 * `minMinutes`. Ties go to the earlier block.
 */
export function findLunchBreak(opening: MinuteRange[], busy: MinuteRange[], minMinutes: number = MIN_LUNCH_BREAK_MINUTES): MinuteRange | null {
	let best: MinuteRange | null = null;
	for (const range of subtractRanges(opening, busy)) {
		const length = range.end - range.start;
		if (!best || length > best.end - best.start) best = range;
	}
	if (!best || best.end - best.start < minMinutes) return null;
	return best;
}
