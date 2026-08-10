// Pure time math for the "Tag und Jahr" clock.
//
// The clock is deliberately not a normal clock:
// - The red mark stands for 21 March (start of spring). It travels once around
//   the circle per year: at the start of spring it is at twelve o'clock and it
//   moves clockwise as the year passes.
// - The blue dot travels once around the circle per day: at local midnight it
//   is at twelve o'clock and it moves clockwise.
//
// IMPORTANT: widgets/TagUndJahrWidget.tsx contains a copy of these formulas.
// The 'widget' directive bundles only the widget function body, so the widget
// cannot import this module - keep both places in sync.

export const SECONDS_PER_DAY = 24 * 60 * 60;

// Month (0-based) and day of the fixed year zero point: 21 March, local time.
export const SPRING_MONTH_INDEX = 2;
export const SPRING_DAY = 21;

/**
 * Fraction [0, 1) of the current day that has passed since local midnight.
 */
export function getDayFraction(date: Date): number {
	const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
	return secondsSinceMidnight / SECONDS_PER_DAY;
}

/**
 * The start of spring (21 March, 00:00 local time) that is at or before the
 * given date.
 */
export function getLastSpringStart(date: Date): Date {
	const springOfSameYear = new Date(date.getFullYear(), SPRING_MONTH_INDEX, SPRING_DAY);
	if (date.getTime() >= springOfSameYear.getTime()) {
		return springOfSameYear;
	}
	return new Date(date.getFullYear() - 1, SPRING_MONTH_INDEX, SPRING_DAY);
}

/**
 * Fraction [0, 1) of the current year cycle (from one 21 March to the next)
 * that has passed.
 */
export function getYearFraction(date: Date): number {
	const lastSpring = getLastSpringStart(date);
	const nextSpring = new Date(lastSpring.getFullYear() + 1, SPRING_MONTH_INDEX, SPRING_DAY);
	return (date.getTime() - lastSpring.getTime()) / (nextSpring.getTime() - lastSpring.getTime());
}

/**
 * Angle of the blue day dot in degrees, clockwise from twelve o'clock.
 */
export function getDayAngleDegrees(date: Date): number {
	return getDayFraction(date) * 360;
}

/**
 * Angle of the red year mark in degrees, clockwise from twelve o'clock.
 * On 21 March the mark stands at twelve o'clock.
 */
export function getYearAngleDegrees(date: Date): number {
	return getYearFraction(date) * 360;
}

/**
 * Fraction [0, 1) of the calendar year (1 January to 1 January) that has
 * passed - the alternative "Neujahr" year start.
 */
export function getCalendarYearFraction(date: Date): number {
	const startOfYear = new Date(date.getFullYear(), 0, 1);
	const startOfNextYear = new Date(date.getFullYear() + 1, 0, 1);
	return (date.getTime() - startOfYear.getTime()) / (startOfNextYear.getTime() - startOfYear.getTime());
}

/**
 * Year mark angle for a configurable year start: 'spring' anchors 21 March at
 * twelve o'clock, 'newyear' anchors 1 January there.
 */
export function getYearAngleDegreesFor(date: Date, yearStart: 'spring' | 'newyear'): number {
	return (yearStart === 'newyear' ? getCalendarYearFraction(date) : getYearFraction(date)) * 360;
}

/**
 * Sun angle in degrees for the "Sonne & Mond" day display: one full clockwise
 * revolution per 24h, anchored at the LEFT horizon point at 06:00 local time
 * (so 12:00 = top, 18:00 = right horizon, 00:00 = bottom, i.e. below the
 * horizon). The moon is the same motion shifted by 12 hours.
 */
export function getSunAngleDegrees(date: Date): number {
	const hoursSinceSix = (getDayFraction(date) * 24 - 6 + 24) % 24;
	return (hoursSinceSix / 24) * 360;
}

/** Moon angle: the sun's motion shifted by 12 hours (above horizon 18:00-06:00). */
export function getMoonAngleDegrees(date: Date): number {
	return (getSunAngleDegrees(date) + 180) % 360;
}
