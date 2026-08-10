// Minimal Directus client for the experimental food widget: load the canteens
// of a Rocket Meals server and the food offers of a canteen for one day.
// Deliberately no caching or retry logic - this is a playground feature, the
// data is fetched fresh whenever the settings screen or the widget sync runs
// (see apps/frontend for the full-blown production variant).

export type Canteen = {
	id: string;
	alias: string;
};

export type Meal = {
	name: string;
	price: string;
};

type DirectusListResponse<T> = {
	data?: T[];
};

type RawTranslation = {
	name?: string | null;
	languages_code?: string | null;
};

type RawFood = {
	alias?: string | null;
	status?: string | null;
	translations?: RawTranslation[] | null;
};

type RawFoodoffer = {
	id: string;
	alias?: string | null;
	price_student?: number | null;
	food?: RawFood | null;
};

type RawCanteen = {
	id: string;
	alias?: string | null;
	status?: string | null;
};

/** Local calendar date as YYYY-MM-DD (Directus foodoffers.date format). */
export function formatLocalDate(date: Date): string {
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/** "1.5" -> "1,50 €"; missing prices become an empty string. */
export function formatEuro(price: number | null | undefined): string {
	if (typeof price !== 'number' || Number.isNaN(price)) {
		return '';
	}
	return `${price.toFixed(2).replace('.', ',')} €`;
}

/**
 * Display name of a food offer: German food translation first, then any
 * translation, then the food/offer alias.
 */
export function getMealName(offer: RawFoodoffer): string {
	const translations = offer.food?.translations ?? [];
	const german = translations.find((translation) => translation.languages_code?.toLowerCase().startsWith('de') && translation.name);
	const any = translations.find((translation) => translation.name);
	return german?.name ?? any?.name ?? offer.food?.alias ?? offer.alias ?? 'Unbekanntes Gericht';
}

/** Maps raw food offers to the widget's meal shape, dropping archived foods. */
export function toMeals(offers: RawFoodoffer[]): Meal[] {
	return offers
		.filter((offer) => offer.food?.status !== 'archived')
		.map((offer) => ({
			name: getMealName(offer),
			price: formatEuro(offer.price_student),
		}));
}

/** Splits meals into pages of `pageSize` for the widget's page rotation. */
export function paginateMeals(meals: Meal[], pageSize: number): Meal[][] {
	if (pageSize <= 0 || meals.length === 0) {
		return [];
	}
	const pages: Meal[][] = [];
	for (let index = 0; index < meals.length; index += pageSize) {
		pages.push(meals.slice(index, index + pageSize));
	}
	return pages;
}

async function fetchJsonAsync<T>(url: string): Promise<T> {
	const response = await fetch(url, { headers: { Accept: 'application/json' } });
	if (!response.ok) {
		throw new Error(`Server antwortete mit ${response.status}`);
	}
	return (await response.json()) as T;
}

export async function fetchCanteensAsync(serverUrl: string): Promise<Canteen[]> {
	const params = new URLSearchParams({
		fields: 'id,alias,status',
		limit: '-1',
	});
	const response = await fetchJsonAsync<DirectusListResponse<RawCanteen>>(`${serverUrl}/items/canteens?${params}`);
	return (response.data ?? [])
		.filter((canteen) => canteen.status !== 'archived')
		.map((canteen) => ({ id: canteen.id, alias: canteen.alias ?? canteen.id }))
		.sort((a, b) => a.alias.localeCompare(b.alias, 'de'));
}

export async function fetchTodaysMealsAsync(serverUrl: string, canteenId: string, today: Date = new Date()): Promise<Meal[]> {
	const params = new URLSearchParams({
		fields: 'id,alias,price_student,food.alias,food.status,food.translations.name,food.translations.languages_code',
		limit: '-1',
		filter: JSON.stringify({
			_and: [{ canteen: { _eq: canteenId } }, { date: { _eq: formatLocalDate(today) } }],
		}),
	});
	const response = await fetchJsonAsync<DirectusListResponse<RawFoodoffer>>(`${serverUrl}/items/foodoffers?${params}`);
	return toMeals(response.data ?? []);
}
