import { getTimelineEntryDates, TIMELINE_DAYS, TIMELINE_STEP_MINUTES } from '../helpers/widgetSync';

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
