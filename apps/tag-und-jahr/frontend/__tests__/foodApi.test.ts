import { formatEuro, formatLocalDate, getMealImageUrl, getMealName, paginateMeals, toMeals } from '../helpers/foodApi';

const SERVER_URL = 'https://example.rocket-meals.de/rocket-meals/api';

describe('formatLocalDate', () => {
	it('formats with zero-padded month and day', () => {
		expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31');
	});
});

describe('formatEuro', () => {
	it('formats German style with two decimals', () => {
		expect(formatEuro(1.5)).toBe('1,50 €');
		expect(formatEuro(12)).toBe('12,00 €');
	});

	it('returns empty string for missing prices', () => {
		expect(formatEuro(null)).toBe('');
		expect(formatEuro(undefined)).toBe('');
	});
});

describe('getMealName', () => {
	it('prefers the German food translation', () => {
		const offer = {
			id: '1',
			alias: 'offer-alias',
			food: {
				alias: 'food-alias',
				translations: [
					{ name: 'Pasta', languages_code: 'en-US' },
					{ name: 'Nudeln', languages_code: 'de-DE' },
				],
			},
		};
		expect(getMealName(offer)).toBe('Nudeln');
	});

	it('falls back to any translation, then aliases', () => {
		expect(getMealName({ id: '1', food: { translations: [{ name: 'Pasta', languages_code: 'en-US' }] } })).toBe('Pasta');
		expect(getMealName({ id: '1', food: { alias: 'food-alias', translations: [] } })).toBe('food-alias');
		expect(getMealName({ id: '1', alias: 'offer-alias' })).toBe('offer-alias');
		expect(getMealName({ id: '1' })).toBe('Unbekanntes Gericht');
	});
});

describe('getMealImageUrl', () => {
	it('builds a scaled Directus assets url from the food image id', () => {
		expect(getMealImageUrl({ id: '1', food: { image: 'file-123' } }, SERVER_URL)).toBe(
			`${SERVER_URL}/assets/file-123?width=160&height=160&fit=cover&quality=60`
		);
		expect(getMealImageUrl({ id: '1', food: { image: { id: 'file-456' } } }, SERVER_URL)).toContain('/assets/file-456?');
	});

	it('falls back to the remote url, then undefined', () => {
		expect(getMealImageUrl({ id: '1', food: { image_remote_url: 'https://example.org/pic.jpg' } }, SERVER_URL)).toBe('https://example.org/pic.jpg');
		expect(getMealImageUrl({ id: '1' }, SERVER_URL)).toBeUndefined();
	});
});

describe('toMeals', () => {
	it('drops offers of archived foods and maps name/price/image', () => {
		const meals = toMeals(
			[
				{ id: '1', price_student: 2.5, food: { alias: 'Schnitzel', status: 'published', image: 'file-123', translations: [] } },
				{ id: '2', price_student: 1, food: { alias: 'Altes Gericht', status: 'archived', translations: [] } },
			],
			SERVER_URL
		);
		expect(meals).toEqual([
			{ name: 'Schnitzel', price: '2,50 €', imageUrl: `${SERVER_URL}/assets/file-123?width=160&height=160&fit=cover&quality=60` },
		]);
	});
});

describe('paginateMeals', () => {
	const meals = Array.from({ length: 5 }, (_, index) => ({ name: `Gericht ${index + 1}`, price: '' }));

	it('splits into pages of the requested size', () => {
		const pages = paginateMeals(meals, 2);
		expect(pages).toHaveLength(3);
		expect(pages[0].map((meal) => meal.name)).toEqual(['Gericht 1', 'Gericht 2']);
		expect(pages[2].map((meal) => meal.name)).toEqual(['Gericht 5']);
	});

	it('handles empty input and non-positive page sizes', () => {
		expect(paginateMeals([], 4)).toEqual([]);
		expect(paginateMeals(meals, 0)).toEqual([]);
	});
});
