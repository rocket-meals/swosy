import { getDayAngleDegrees, getDayFraction, getLastSpringStart, getYearAngleDegrees, getYearFraction } from '../helpers/clock';

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
