import {
	enabledTimeUnits,
	sanitizeTimeSegmentText,
	splitSecondsToSegments,
	segmentsToSeconds,
	padTimeSegment,
	formatSecondsWithUnits,
	// Deep import: the package root pulls in expo-sqlite, which jest can't load.
} from 'repo-depkit-common-ui/src/components/SettingsListTimeInput/timeInputHelpers';

describe('common-ui time input helpers (SettingsListTimeInput)', () => {
	describe('enabledTimeUnits', () => {
		it('defaults to all units in display order', () => {
			expect(enabledTimeUnits({})).toEqual(['hours', 'minutes', 'seconds']);
		});

		it('filters disabled units', () => {
			expect(enabledTimeUnits({ hoursEnabled: false })).toEqual(['minutes', 'seconds']);
			expect(enabledTimeUnits({ secondsEnabled: false })).toEqual(['hours', 'minutes']);
			expect(enabledTimeUnits({ hoursEnabled: false, secondsEnabled: false })).toEqual(['minutes']);
		});
	});

	describe('sanitizeTimeSegmentText', () => {
		it('strips non-digits and caps at 2 characters', () => {
			expect(sanitizeTimeSegmentText('1a2')).toBe('12');
			expect(sanitizeTimeSegmentText('1234')).toBe('12');
			expect(sanitizeTimeSegmentText('')).toBe('');
		});
	});

	describe('splitSecondsToSegments', () => {
		it('splits into hours/minutes/seconds', () => {
			expect(splitSecondsToSegments(1 * 3600 + 45 * 60 + 30, {})).toEqual({ hours: 1, minutes: 45, seconds: 30 });
		});

		it('overflows into the largest enabled unit when hours are disabled', () => {
			// 1.5h with hours disabled shows as 90 minutes.
			expect(splitSecondsToSegments(5400, { hoursEnabled: false })).toEqual({ minutes: 90, seconds: 0 });
		});

		it('drops the remainder below the smallest enabled unit', () => {
			expect(splitSecondsToSegments(90, { secondsEnabled: false })).toEqual({ hours: 0, minutes: 1 });
		});

		it('caps segments at the 2-digit maximum', () => {
			expect(splitSecondsToSegments(200 * 60, { hoursEnabled: false }).minutes).toBe(99);
		});
	});

	describe('segmentsToSeconds', () => {
		it('sums the segments', () => {
			expect(segmentsToSeconds({ hours: 12, minutes: 30, seconds: 0 })).toBe(12 * 3600 + 30 * 60);
		});

		it('accepts segment texts and treats empty as 0', () => {
			expect(segmentsToSeconds({ hours: '01', minutes: '', seconds: '5' })).toBe(3600 + 5);
		});

		it('returns 0 for no segments', () => {
			expect(segmentsToSeconds({})).toBe(0);
		});
	});

	describe('padTimeSegment', () => {
		it('zero-pads to 2 digits', () => {
			expect(padTimeSegment(5)).toBe('05');
			expect(padTimeSegment('')).toBe('00');
			expect(padTimeSegment(45)).toBe('45');
		});
	});

	describe('formatSecondsWithUnits', () => {
		it('formats the enabled units with their abbreviations', () => {
			expect(formatSecondsWithUnits(12 * 3600 + 30 * 60, {})).toBe('12h 30m 00s');
			expect(formatSecondsWithUnits(5400, { hoursEnabled: false })).toBe('90m 00s');
			expect(formatSecondsWithUnits(90, { secondsEnabled: false })).toBe('00h 01m');
		});
	});
});
