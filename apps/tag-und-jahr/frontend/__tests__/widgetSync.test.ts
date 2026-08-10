import {
	FOOD_FAST_STEP_SECONDS,
	FOOD_FAST_WINDOW_MINUTES,
	FOOD_SLOW_STEP_SECONDS,
	getFoodTimelineEntryDates,
	getTimelineEntryDates,
	TIMELINE_DAYS,
	TIMELINE_STEP_MINUTES,
} from '../helpers/widgetSync';

describe('widget timeline entry dates', () => {
	const stepMs = TIMELINE_STEP_MINUTES * 60 * 1000;

	it('starts at the most recent half-hour boundary', () => {
		const now = new Date(2026, 7, 9, 14, 42, 13);
		const dates = getTimelineEntryDates(now);
		expect(dates[0].getMinutes()).toBe(30);
		expect(dates[0].getHours()).toBe(14);
		expect(dates[0].getSeconds()).toBe(0);
	});

	it('spaces all entries exactly one step apart', () => {
		const dates = getTimelineEntryDates(new Date(2026, 7, 9, 14, 42, 13));
		for (let i = 1; i < dates.length; i++) {
			expect(dates[i].getTime() - dates[i - 1].getTime()).toBe(stepMs);
		}
	});

	it('covers the configured number of days', () => {
		const now = new Date(2026, 7, 9, 14, 42, 13);
		const dates = getTimelineEntryDates(now);
		const expectedEntries = (TIMELINE_DAYS * 24 * 60) / TIMELINE_STEP_MINUTES;
		expect(dates.length).toBeGreaterThanOrEqual(expectedEntries);
		const last = dates[dates.length - 1];
		expect(last.getTime() - now.getTime()).toBeLessThanOrEqual(TIMELINE_DAYS * 24 * 60 * 60 * 1000);
	});
});

describe('food widget timeline entry dates (auto pagination)', () => {
	it('uses 10-second steps in the fast window, then minute steps', () => {
		const now = new Date(2026, 7, 9, 10, 0, 0);
		const dates = getFoodTimelineEntryDates(now);
		expect(dates[1].getTime() - dates[0].getTime()).toBe(FOOD_FAST_STEP_SECONDS * 1000);
		const fastEntries = (FOOD_FAST_WINDOW_MINUTES * 60) / FOOD_FAST_STEP_SECONDS;
		expect(dates[fastEntries + 1].getTime() - dates[fastEntries].getTime()).toBe(FOOD_SLOW_STEP_SECONDS * 1000);
	});

	it('never crosses into the next day', () => {
		const now = new Date(2026, 7, 9, 23, 30, 0);
		const dates = getFoodTimelineEntryDates(now);
		const endOfDay = new Date(2026, 7, 10).getTime();
		expect(dates.length).toBeGreaterThan(0);
		expect(dates[dates.length - 1].getTime()).toBeLessThan(endOfDay);
	});
});
