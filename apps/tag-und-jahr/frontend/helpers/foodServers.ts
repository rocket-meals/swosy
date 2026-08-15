// The Rocket Meals backends the experimental food widget can talk to.
// Same ground truth as packages/common/src/ServerHelper.ts - repeated here as a
// typed list so the settings screen can render it directly.

export type FoodServerKey = 'studi-futter' | 'swosy' | 'rocket-meals';

export type FoodServer = {
	key: FoodServerKey;
	label: string;
	serverUrl: string;
};

export const FOOD_SERVERS: FoodServer[] = [
	{
		key: 'studi-futter',
		label: 'Studi-Futter',
		serverUrl: 'https://studi-futter.rocket-meals.de/rocket-meals/api',
	},
	{
		key: 'swosy',
		label: 'SWOSY',
		serverUrl: 'https://swosy.rocket-meals.de/rocket-meals/api',
	},
	{
		key: 'rocket-meals',
		label: 'Rocket Meals (Test)',
		serverUrl: 'https://test.rocket-meals.de/rocket-meals/api',
	},
];

// `key` is a plain string on purpose: it also accepts persisted values that no
// longer match a known FoodServerKey (returns undefined for those).
export function getFoodServer(key: string | undefined): FoodServer | undefined {
	return FOOD_SERVERS.find((server) => server.key === key);
}
