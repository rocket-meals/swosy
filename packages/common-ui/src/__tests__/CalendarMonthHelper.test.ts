import { addMonths, dateToDateString, getDaysInMonth, getMonthGrid, orderWeekdayLabels, parseYearMonth, toDateString } from '../helpers/CalendarMonthHelper';

describe('CalendarMonthHelper', () => {
	it('formats dates with zero padding', () => {
		expect(toDateString(2026, 0, 5)).toBe('2026-01-05');
		expect(dateToDateString(new Date(2026, 9, 7))).toBe('2026-10-07');
	});

	it('parses a date string into year and month', () => {
		expect(parseYearMonth('2026-10-07')).toEqual({ year: 2026, monthIndex: 9 });
		expect(parseYearMonth('07.10.2026')).toBeNull();
		expect(parseYearMonth('2026-13-01')).toBeNull();
		expect(parseYearMonth(undefined)).toBeNull();
	});

	it('knows leap years', () => {
		expect(getDaysInMonth(2024, 1)).toBe(29);
		expect(getDaysInMonth(2026, 1)).toBe(28);
	});

	it('moves across year boundaries', () => {
		expect(addMonths(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
		expect(addMonths(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
	});

	it('starts October 2026 on a Thursday for a Monday-first week', () => {
		const rows = getMonthGrid(2026, 9, 1);
		expect(rows[0]).toHaveLength(7);
		expect(rows[0]?.slice(0, 3)).toEqual([null, null, null]);
		expect(rows[0]?.[3]).toEqual({ dateString: '2026-10-01', day: 1 });
		const allDays = rows.flat().filter(cell => cell !== null);
		expect(allDays).toHaveLength(31);
		for (const row of rows) expect(row).toHaveLength(7);
	});

	it('shifts the grid for a Sunday-first week', () => {
		const rows = getMonthGrid(2026, 9, 0);
		expect(rows[0]?.[4]).toEqual({ dateString: '2026-10-01', day: 1 });
	});

	it('orders weekday labels by the first day of the week', () => {
		const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
		expect(orderWeekdayLabels(labels, 1)).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
		expect(orderWeekdayLabels(labels, 0)).toEqual(labels);
	});
});
