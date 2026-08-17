import { RatingHelper } from '../RatingHelper';

describe('RatingHelper constants', () => {
	it('spans 1 to 5 stars', () => {
		expect(RatingHelper.MIN_RATING).toBe(1);
		expect(RatingHelper.MAX_RATING).toBe(5);
	});

	it('derives the average, low and high values from the bounds', () => {
		expect(RatingHelper.RATING_VALUE_AVG).toBe(3);
		expect(RatingHelper.RATING_VALUE_LOW).toBe(RatingHelper.MIN_RATING);
		expect(RatingHelper.RATING_VALUE_HIGH).toBe(RatingHelper.MAX_RATING);
	});

	it('places the invalid sentinels just outside the range', () => {
		expect(RatingHelper.RATING_VALUE_INVALID_LOW).toBe(0);
		expect(RatingHelper.RATING_VALUE_INVALID_HIGH).toBe(6);
	});
});

describe('RatingHelper.getNumberIfValueInRatingRange', () => {
	it('returns values inside the range unchanged', () => {
		for (const value of [1, 2, 3, 4, 5]) {
			expect(RatingHelper.getNumberIfValueInRatingRange(value)).toBe(value);
		}
	});

	it('accepts fractional values inside the range', () => {
		expect(RatingHelper.getNumberIfValueInRatingRange(3.7)).toBe(3.7);
	});

	it('rejects values outside the range', () => {
		expect(RatingHelper.getNumberIfValueInRatingRange(RatingHelper.RATING_VALUE_INVALID_LOW)).toBeNull();
		expect(RatingHelper.getNumberIfValueInRatingRange(RatingHelper.RATING_VALUE_INVALID_HIGH)).toBeNull();
		expect(RatingHelper.getNumberIfValueInRatingRange(-10)).toBeNull();
	});

	it('rejects null and undefined', () => {
		expect(RatingHelper.getNumberIfValueInRatingRange(null)).toBeNull();
		expect(RatingHelper.getNumberIfValueInRatingRange(undefined)).toBeNull();
	});

	it('keeps the bounds inclusive', () => {
		expect(RatingHelper.getNumberIfValueInRatingRange(RatingHelper.MIN_RATING)).toBe(RatingHelper.MIN_RATING);
		expect(RatingHelper.getNumberIfValueInRatingRange(RatingHelper.MAX_RATING)).toBe(RatingHelper.MAX_RATING);
	});
});

describe('RatingHelper.isMaxRating', () => {
	it('is true only for the maximum rating', () => {
		expect(RatingHelper.isMaxRating(RatingHelper.MAX_RATING)).toBe(true);
		expect(RatingHelper.isMaxRating(RatingHelper.MAX_RATING - 1)).toBe(false);
	});

	it('is false for out-of-range values, including one above the maximum', () => {
		expect(RatingHelper.isMaxRating(RatingHelper.RATING_VALUE_INVALID_HIGH)).toBe(false);
		expect(RatingHelper.isMaxRating(0)).toBe(false);
	});

	it('is false for null and undefined', () => {
		expect(RatingHelper.isMaxRating(null)).toBe(false);
		expect(RatingHelper.isMaxRating(undefined)).toBe(false);
	});
});
