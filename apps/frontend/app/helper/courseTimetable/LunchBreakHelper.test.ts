import { findLunchBreak, getOpeningRangesForDate, mergeRanges, subtractRanges } from './LunchBreakHelper';

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

describe('LunchBreakHelper', () => {
	describe('getOpeningRangesForDate', () => {
		const base = { status: 'published', wednesday: true, time_start: '11:30:00', time_end: '14:00:00' };

		it('returns the hours of a matching weekday', () => {
			expect(getOpeningRangesForDate([base], '2026-10-07', 'wednesday')).toEqual([{ start: h(11, 30), end: h(14) }]);
		});

		it('ignores other weekdays, drafts and rows outside their validity', () => {
			expect(getOpeningRangesForDate([base], '2026-10-08', 'thursday')).toEqual([]);
			expect(getOpeningRangesForDate([{ ...base, status: 'draft' }], '2026-10-07', 'wednesday')).toEqual([]);
			expect(getOpeningRangesForDate([{ ...base, date_valid_till: '2026-09-30' }], '2026-10-07', 'wednesday')).toEqual([]);
			expect(getOpeningRangesForDate([{ ...base, date_valid_from: '2026-10-08' }], '2026-10-07', 'wednesday')).toEqual([]);
		});

		it('merges overlapping rows', () => {
			const second = { ...base, time_start: '13:00', time_end: '15:00' };
			expect(getOpeningRangesForDate([base, second], '2026-10-07', 'wednesday')).toEqual([{ start: h(11, 30), end: h(15) }]);
		});
	});

	it('merges touching ranges', () => {
		expect(
			mergeRanges([
				{ start: 10, end: 20 },
				{ start: 20, end: 30 },
				{ start: 40, end: 50 },
			])
		).toEqual([
			{ start: 10, end: 30 },
			{ start: 40, end: 50 },
		]);
	});

	it('cuts busy blocks out of the opening hours', () => {
		expect(subtractRanges([{ start: h(11), end: h(14) }], [{ start: h(12), end: h(12, 30) }])).toEqual([
			{ start: h(11), end: h(12) },
			{ start: h(12, 30), end: h(14) },
		]);
	});

	describe('findLunchBreak', () => {
		const opening = [{ start: h(11, 30), end: h(14) }];

		it('uses the whole opening when the day is free', () => {
			expect(findLunchBreak(opening, [])).toEqual({ start: h(11, 30), end: h(14) });
		});

		it('shortens the block when a lecture runs into the opening hours', () => {
			expect(findLunchBreak(opening, [{ start: h(10, 15), end: h(11, 45) }])).toEqual({ start: h(11, 45), end: h(14) });
		});

		it('picks the larger part when an event sits in the middle', () => {
			expect(findLunchBreak(opening, [{ start: h(12, 15), end: h(13, 0) }])).toEqual({ start: h(13), end: h(14) });
		});

		it('needs at least 30 minutes', () => {
			expect(findLunchBreak(opening, [{ start: h(11, 0), end: h(13, 35) }])).toBeNull();
			expect(findLunchBreak(opening, [{ start: h(11, 0), end: h(13, 30) }])).toEqual({ start: h(13, 30), end: h(14) });
		});

		it('returns null without opening hours', () => {
			expect(findLunchBreak([], [])).toBeNull();
		});
	});
});
