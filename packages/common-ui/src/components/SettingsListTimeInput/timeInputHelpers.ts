/**
 * timeInputHelpers.ts – pure logic for the segmented HH:MM:SS time input
 * (see TimeInputFields / SettingsListTimeInput). No React imports so the
 * functions stay unit-testable from plain Node tooling.
 *
 * The input works on a total-seconds number; which of the hour/minute/second
 * segments are shown is controlled by enable flags. Disabled leading units
 * overflow into the largest enabled one (90 minutes with hours disabled stays
 * "90m"), a disabled seconds segment simply cuts the remainder off.
 */

export type TimeUnit = 'hours' | 'minutes' | 'seconds';

export interface TimeUnitsEnabled {
	hoursEnabled?: boolean;
	minutesEnabled?: boolean;
	secondsEnabled?: boolean;
}

export const TIME_UNIT_ABBREVIATIONS: Record<TimeUnit, string> = {
	hours: 'h',
	minutes: 'm',
	seconds: 's',
};

const UNIT_SECONDS: Record<TimeUnit, number> = {
	hours: 3600,
	minutes: 60,
	seconds: 1,
};

/** Each segment holds at most 2 digits. */
export const MAX_SEGMENT_VALUE = 99;

/** The enabled units in display order (largest first). Defaults to all enabled. */
export function enabledTimeUnits(enabled: TimeUnitsEnabled): TimeUnit[] {
	const units: TimeUnit[] = [];
	if (enabled.hoursEnabled !== false) units.push('hours');
	if (enabled.minutesEnabled !== false) units.push('minutes');
	if (enabled.secondsEnabled !== false) units.push('seconds');
	return units;
}

/** Keep only digits, capped at the 2-digit segment length. */
export function sanitizeTimeSegmentText(text: string): string {
	return text.replace(/\D/g, '').slice(0, 2);
}

/**
 * Split a total-seconds value into the enabled segments. The largest enabled
 * unit absorbs everything above it (capped at 99, the 2-digit maximum);
 * anything below the smallest enabled unit is dropped.
 */
export function splitSecondsToSegments(totalSeconds: number, enabled: TimeUnitsEnabled): Partial<Record<TimeUnit, number>> {
	const units = enabledTimeUnits(enabled);
	const segments: Partial<Record<TimeUnit, number>> = {};
	let remaining = Math.max(0, Math.floor(totalSeconds));
	units.forEach((unit, index) => {
		const isLargest = index === 0;
		let value = Math.floor(remaining / UNIT_SECONDS[unit]);
		if (!isLargest) value = value % (UNIT_SECONDS[units[index - 1]] / UNIT_SECONDS[unit]);
		value = Math.min(value, MAX_SEGMENT_VALUE);
		segments[unit] = value;
		remaining -= value * UNIT_SECONDS[unit];
	});
	return segments;
}

/** Total seconds for the given segment texts ("" counts as 0). */
export function segmentsToSeconds(segments: Partial<Record<TimeUnit, number | string>>): number {
	let total = 0;
	for (const unit of Object.keys(UNIT_SECONDS) as TimeUnit[]) {
		const raw = segments[unit];
		if (raw == null || raw === '') continue;
		const value = typeof raw === 'string' ? Number.parseInt(raw, 10) : raw;
		if (!Number.isNaN(value)) total += value * UNIT_SECONDS[unit];
	}
	return total;
}

/** Zero-pad a segment value to the 2-digit display form. */
export function padTimeSegment(value: number | string): string {
	return String(value).padStart(2, '0');
}

/** Human-readable value for settings rows, e.g. "12h 30m 00s" (enabled units only). */
export function formatSecondsWithUnits(totalSeconds: number, enabled: TimeUnitsEnabled): string {
	const segments = splitSecondsToSegments(totalSeconds, enabled);
	return enabledTimeUnits(enabled)
		.map((unit) => `${padTimeSegment(segments[unit] ?? 0)}${TIME_UNIT_ABBREVIATIONS[unit]}`)
		.join(' ');
}
