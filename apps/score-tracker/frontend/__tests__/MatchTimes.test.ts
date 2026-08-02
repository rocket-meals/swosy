/** Unit tests for the built-in match time helpers (helpers/MatchTimes). */

import { durationMinutesBetween, formatTimestampAsDateTime, parseDateTimeInput } from '../helpers/MatchTimes';

describe('durationMinutesBetween', () => {
	it('returns whole minutes between start and end', () => {
		const start = new Date(2024, 4, 1, 19, 30).getTime();
		const end = new Date(2024, 4, 1, 22, 45).getTime();
		expect(durationMinutesBetween(start, end)).toBe(195);
	});

	it('rounds to the nearest minute', () => {
		const start = new Date(2024, 4, 1, 19, 30, 40).getTime();
		const end = new Date(2024, 4, 1, 19, 32, 0).getTime();
		expect(durationMinutesBetween(start, end)).toBe(1);
	});

	it.each([
		['a missing start', undefined, 1000],
		['a missing end', 1000, undefined],
		['a negative range', 2000, new Date(0).getTime()],
	])('returns null for %s', (_name, start, end) => {
		expect(durationMinutesBetween(start as number | undefined, end as number | undefined)).toBeNull();
	});
});

describe('formatTimestampAsDateTime / parseDateTimeInput', () => {
	it('round-trips a local timestamp at minute precision', () => {
		const timestamp = new Date(2024, 11, 24, 18, 5).getTime();
		const formatted = formatTimestampAsDateTime(timestamp);
		expect(formatted).toBe('24.12.2024 18:05');
		expect(parseDateTimeInput(formatted)).toBe(timestamp);
	});

	it.each([
		['garbage', 'hallo'],
		['a date without a time', '24.12.2024'],
		['a rolled-over day', '32.01.2024 10:00'],
		['an invalid hour', '01.01.2024 24:00'],
	])('rejects %s', (_name, value) => {
		expect(parseDateTimeInput(value)).toBeNull();
	});
});
