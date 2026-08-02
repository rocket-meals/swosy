// ─── Built-in match times ─────────────────────────────────────────────────────
//
// Every match records its start and end as full timestamps (date + time), no
// matter which game it belongs to - they are not custom categories (see
// GameCategories) but fixed fields of the match itself:
// - `startedAt` is stamped automatically when "Spiel starten" is pressed
// - `endedAt` is stamped when the match is ended ("Partie beenden")
// - `durationMinutes` is derived from the two, but stored alongside them so an
//   archived match keeps its duration even if a timestamp is edited later.

/**
 * Sort key of the match list for ordering by the built-in duration - lives in
 * the same `MatchSort.categoryId` slot as a real category id, so the prefix
 * makes sure it can never collide with one (generated ids are alphanumeric).
 */
export const BUILTIN_DURATION_SORT_ID = 'builtin:duration';

const MINUTE_MS = 60000;

function pad2(value: number): string {
	return value < 10 ? `0${value}` : String(value);
}

/** Whole minutes between two timestamps, or `null` when either is missing or the range is negative. */
export function durationMinutesBetween(startedAt: number | undefined | null, endedAt: number | undefined | null): number | null {
	if (startedAt == null || endedAt == null || endedAt < startedAt) return null;
	return Math.round((endedAt - startedAt) / MINUTE_MS);
}

/** Timestamp → `DD.MM.YYYY HH:MM` (local time), the form the built-in time rows show and accept. */
export function formatTimestampAsDateTime(timestamp: number): string {
	const date = new Date(timestamp);
	return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

const DATE_TIME_REGEX = /^(\d{2})\.(\d{2})\.(\d{4})[ ,]+([01]\d|2[0-3]):([0-5]\d)$/;

/** `DD.MM.YYYY HH:MM` (local time) → timestamp, or `null` when malformed or not a real calendar day. */
export function parseDateTimeInput(value: string): number | null {
	const match = DATE_TIME_REGEX.exec(value.trim());
	if (!match) return null;
	const [, day, month, year, hours, minutes] = match;
	const date = new Date(
		Number.parseInt(year, 10),
		Number.parseInt(month, 10) - 1,
		Number.parseInt(day, 10),
		Number.parseInt(hours, 10),
		Number.parseInt(minutes, 10),
	);
	// new Date() silently rolls over invalid days (32.01. → 01.02.), so verify.
	if (date.getDate() !== Number.parseInt(day, 10) || date.getMonth() !== Number.parseInt(month, 10) - 1) return null;
	return date.getTime();
}
