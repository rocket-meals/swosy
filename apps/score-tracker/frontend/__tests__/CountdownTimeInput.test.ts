import {
	MAX_TIME_DIGITS,
	sanitizeTimeDigits,
	padTimeDigits,
	timeDigitSegments,
	parseTimeDigitsToSeconds,
} from '../helpers/CountdownTimeInput';

describe('CountdownTimeInput', () => {
	describe('sanitizeTimeDigits', () => {
		it('strips non-digits', () => {
			expect(sanitizeTimeDigits('1a2:3 4')).toBe('1234');
		});

		it('caps at the mask length', () => {
			expect(sanitizeTimeDigits('123456789')).toBe('123456');
			expect(sanitizeTimeDigits('123456789')).toHaveLength(MAX_TIME_DIGITS);
		});

		it('keeps the empty string', () => {
			expect(sanitizeTimeDigits('')).toBe('');
		});
	});

	describe('padTimeDigits', () => {
		it('right-pads with zeros so typed digits fill from the left', () => {
			// The example from the feature request: typing "123" shows "12h 30m 00s".
			expect(padTimeDigits('123')).toBe('123000');
		});

		it('leaves a full entry untouched', () => {
			expect(padTimeDigits('123456')).toBe('123456');
		});

		it('pads the empty entry to all zeros', () => {
			expect(padTimeDigits('')).toBe('000000');
		});
	});

	describe('timeDigitSegments', () => {
		it('splits into hours/minutes/seconds', () => {
			expect(timeDigitSegments('123')).toEqual({ hours: '12', minutes: '30', seconds: '00' });
			expect(timeDigitSegments('014530')).toEqual({ hours: '01', minutes: '45', seconds: '30' });
		});
	});

	describe('parseTimeDigitsToSeconds', () => {
		it('returns 0 for no input', () => {
			expect(parseTimeDigitsToSeconds('')).toBe(0);
		});

		it('computes hours, minutes and seconds', () => {
			// "12h 30m 00s"
			expect(parseTimeDigitsToSeconds('123')).toBe(12 * 3600 + 30 * 60);
			// "01h 45m 30s"
			expect(parseTimeDigitsToSeconds('014530')).toBe(1 * 3600 + 45 * 60 + 30);
		});

		it('takes over-long minute segments at face value (kitchen-timer style)', () => {
			// "00h 90m 00s" = 90 minutes
			expect(parseTimeDigitsToSeconds('0090')).toBe(90 * 60);
		});
	});
});
