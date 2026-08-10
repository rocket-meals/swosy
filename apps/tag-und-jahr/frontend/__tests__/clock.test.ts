import {
	getCalendarYearFraction,
	getDayAngleDegrees,
	getDayFraction,
	getLastSpringStart,
	getMoonAngleDegrees,
	getSunAngleDegrees,
	getYearAngleDegrees,
	getYearAngleDegreesFor,
	getYearFraction,
} from '../helpers/clock';

describe('day fraction and angle', () => {
	it('is 0 at local midnight', () => {
		expect(getDayFraction(new Date(2026, 7, 9, 0, 0, 0))).toBe(0);
		expect(getDayAngleDegrees(new Date(2026, 7, 9, 0, 0, 0))).toBe(0);
	});

	it('is 0.5 (180 degrees) at local noon', () => {
		expect(getDayFraction(new Date(2026, 7, 9, 12, 0, 0))).toBe(0.5);
		expect(getDayAngleDegrees(new Date(2026, 7, 9, 12, 0, 0))).toBe(180);
	});

	it('is 0.25 (90 degrees) at 06:00', () => {
		expect(getDayAngleDegrees(new Date(2026, 7, 9, 6, 0, 0))).toBe(90);
	});

	it('stays below 1 just before midnight', () => {
		expect(getDayFraction(new Date(2026, 7, 9, 23, 59, 59))).toBeLessThan(1);
	});
});

describe('spring start (21 March, year zero point)', () => {
	it('uses the same year for dates after 21 March', () => {
		const lastSpring = getLastSpringStart(new Date(2026, 7, 9));
		expect(lastSpring.getFullYear()).toBe(2026);
		expect(lastSpring.getMonth()).toBe(2);
		expect(lastSpring.getDate()).toBe(21);
	});

	it('uses the previous year for dates before 21 March', () => {
		const lastSpring = getLastSpringStart(new Date(2026, 0, 15));
		expect(lastSpring.getFullYear()).toBe(2025);
	});

	it('uses the same year exactly on 21 March', () => {
		const lastSpring = getLastSpringStart(new Date(2026, 2, 21, 0, 0, 0));
		expect(lastSpring.getFullYear()).toBe(2026);
	});
});

describe('year fraction and angle', () => {
	it('is 0 (mark at twelve) at the start of spring', () => {
		expect(getYearFraction(new Date(2026, 2, 21, 0, 0, 0))).toBe(0);
		expect(getYearAngleDegrees(new Date(2026, 2, 21, 0, 0, 0))).toBe(0);
	});

	it('is about 0.5 half a year after the start of spring', () => {
		// 21 March 2026 + half of the 365-day cycle
		const halfYear = new Date(2026, 2, 21);
		halfYear.setDate(halfYear.getDate() + 182);
		expect(getYearFraction(halfYear)).toBeGreaterThan(0.49);
		expect(getYearFraction(halfYear)).toBeLessThan(0.51);
	});

	it('stays below 1 just before the next start of spring', () => {
		expect(getYearFraction(new Date(2027, 2, 20, 23, 59, 59))).toBeLessThan(1);
		expect(getYearFraction(new Date(2027, 2, 20, 23, 59, 59))).toBeGreaterThan(0.99);
	});
});

describe('calendar year fraction (Neujahr start)', () => {
	it('is 0 on 1 January and ~0.5 mid-year', () => {
		expect(getCalendarYearFraction(new Date(2026, 0, 1, 0, 0, 0))).toBe(0);
		const midYear = getCalendarYearFraction(new Date(2026, 6, 2, 12, 0, 0));
		expect(midYear).toBeGreaterThan(0.49);
		expect(midYear).toBeLessThan(0.51);
	});

	it('getYearAngleDegreesFor switches the anchor', () => {
		const newYear = new Date(2026, 0, 1, 0, 0, 0);
		expect(getYearAngleDegreesFor(newYear, 'newyear')).toBe(0);
		expect(getYearAngleDegreesFor(newYear, 'spring')).toBeGreaterThan(180);
		const spring = new Date(2026, 2, 21, 0, 0, 0);
		expect(getYearAngleDegreesFor(spring, 'spring')).toBe(0);
	});
});

describe('sun and moon angles (Sonne & Mond display)', () => {
	it('anchors the sun left at 06:00, top at 12:00, right at 18:00', () => {
		expect(getSunAngleDegrees(new Date(2026, 7, 9, 6, 0, 0))).toBe(0);
		expect(getSunAngleDegrees(new Date(2026, 7, 9, 12, 0, 0))).toBe(90);
		expect(getSunAngleDegrees(new Date(2026, 7, 9, 18, 0, 0))).toBe(180);
		expect(getSunAngleDegrees(new Date(2026, 7, 9, 0, 0, 0))).toBe(270);
	});

	it('shifts the moon by 12 hours', () => {
		expect(getMoonAngleDegrees(new Date(2026, 7, 9, 18, 0, 0))).toBe(0);
		expect(getMoonAngleDegrees(new Date(2026, 7, 9, 0, 0, 0))).toBe(90);
	});
});
