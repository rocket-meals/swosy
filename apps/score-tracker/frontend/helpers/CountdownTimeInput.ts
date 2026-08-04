/**
 * Digit-string model for the custom countdown start time input (timer screen).
 *
 * The user types plain digits on a num-pad and they fill the HH:MM:SS mask
 * from the left: typing "123" reads as "12h 30m 00s". Internally the input is
 * just the typed digit string ("123"); these helpers pad and slice it into
 * the hour/minute/second segments and compute the resulting duration.
 */

/** HH + MM + SS */
export const MAX_TIME_DIGITS = 6;

/** Keep only digits, capped at the mask length - the canonical input sanitizer. */
export function sanitizeTimeDigits(text: string): string {
	return text.replace(/\D/g, '').slice(0, MAX_TIME_DIGITS);
}

/** Right-pad the typed digits with zeros to the full mask ("123" -> "123000"). */
export function padTimeDigits(digits: string): string {
	return digits.padEnd(MAX_TIME_DIGITS, '0');
}

/** The mask split into { hours: "12", minutes: "30", seconds: "00" } display segments. */
export function timeDigitSegments(digits: string): { hours: string; minutes: string; seconds: string } {
	const padded = padTimeDigits(digits);
	return { hours: padded.slice(0, 2), minutes: padded.slice(2, 4), seconds: padded.slice(4, 6) };
}

/**
 * Total duration in seconds for the typed digits. Segments are taken at face
 * value (e.g. "0090" = 90 minutes = 5400s) - no base-60 rejection, matching
 * how kitchen timers treat over-long minute/second entries.
 */
export function parseTimeDigitsToSeconds(digits: string): number {
	const { hours, minutes, seconds } = timeDigitSegments(digits);
	return Number.parseInt(hours, 10) * 3600 + Number.parseInt(minutes, 10) * 60 + Number.parseInt(seconds, 10);
}
