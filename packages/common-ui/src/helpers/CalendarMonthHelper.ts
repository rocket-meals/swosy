/**
 * Pure date math for the month calendar (`MyCalendarMonth`). Kept free of react-native so the
 * package's Node test suite can cover it.
 *
 * Dates are handled as local calendar days in the ISO form `YYYY-MM-DD`; no time zone math.
 */

export type CalendarDayCell = {
	/** `YYYY-MM-DD` of this day. */
	dateString: string;
	day: number;
};

/** One week row: seven cells, `null` where the day belongs to the previous/next month. */
export type CalendarWeekRow = (CalendarDayCell | null)[];

function pad2(value: number): string {
	return value < 10 ? `0${value}` : String(value);
}

/** Formats year, month (0-based) and day as `YYYY-MM-DD`. */
export function toDateString(year: number, monthIndex: number, day: number): string {
	return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

/** Formats a Date's local calendar day as `YYYY-MM-DD`. */
export function dateToDateString(date: Date): string {
	return toDateString(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Parses `YYYY-MM-DD` into `{ year, monthIndex }`; null for anything else. */
export function parseYearMonth(dateString: string | null | undefined): { year: number; monthIndex: number } | null {
	if (!dateString) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
	if (!match) return null;
	const year = Number.parseInt(match[1] ?? '', 10);
	const month = Number.parseInt(match[2] ?? '', 10);
	if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) return null;
	return { year, monthIndex: month - 1 };
}

/** Number of days in the given month (monthIndex is 0-based). */
export function getDaysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}

/** Moves a `{ year, monthIndex }` pair by `delta` months. */
export function addMonths(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
	const total = year * 12 + monthIndex + delta;
	return { year: Math.floor(total / 12), monthIndex: ((total % 12) + 12) % 12 };
}

/**
 * Builds the week rows of a month.
 *
 * @param firstDayOfWeek 0 = Sunday, 1 = Monday, … 6 = Saturday (same as `Date.getDay()`).
 */
export function getMonthGrid(year: number, monthIndex: number, firstDayOfWeek: number): CalendarWeekRow[] {
	const startOffset = (new Date(year, monthIndex, 1).getDay() - firstDayOfWeek + 7) % 7;
	const daysInMonth = getDaysInMonth(year, monthIndex);
	const cells: (CalendarDayCell | null)[] = [];
	for (let i = 0; i < startOffset; i++) cells.push(null);
	for (let day = 1; day <= daysInMonth; day++) {
		cells.push({ dateString: toDateString(year, monthIndex, day), day });
	}
	while (cells.length % 7 !== 0) cells.push(null);

	const rows: CalendarWeekRow[] = [];
	for (let i = 0; i < cells.length; i += 7) {
		rows.push(cells.slice(i, i + 7));
	}
	return rows;
}

/**
 * Orders seven weekday labels given Sunday-first (index 0 = Sunday) so they start at
 * `firstDayOfWeek`.
 */
export function orderWeekdayLabels(sundayFirstLabels: readonly string[], firstDayOfWeek: number): string[] {
	const ordered: string[] = [];
	for (let i = 0; i < 7; i++) {
		ordered.push(sundayFirstLabels[(firstDayOfWeek + i) % 7] ?? '');
	}
	return ordered;
}
