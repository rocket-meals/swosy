jest.mock('@/redux/storage/sqliteStorage', () => {
	const store = new Map<string, string>();
	return {
		sqliteKeyValueStorage: {
			getItem: async (key: string) => (store.has(key) ? (store.get(key) as string) : null),
			setItem: async (key: string, value: string) => {
				store.set(key, value);
			},
			removeItem: async (key: string) => {
				store.delete(key);
			},
			multiRemove: async (keys: string[]) => {
				keys.forEach((key) => store.delete(key));
			},
			clear: async () => {
				store.clear();
			},
		},
	};
});

import { sqliteKeyValueStorage } from '@/redux/storage/sqliteStorage';
import { cacheFoodOffers, getCachedFoodOffers } from './FoodOffersCacheHelper';

describe('FoodOffersCacheHelper', () => {
	beforeEach(async () => {
		await sqliteKeyValueStorage.clear();
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-07-16T10:00:00'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('caches and reads back today and tomorrow', async () => {
		await cacheFoodOffers('canteenA', '2026-07-16', [{ id: '1' } as any]);
		await cacheFoodOffers('canteenA', '2026-07-17', [{ id: '2' } as any]);

		expect((await getCachedFoodOffers('canteenA', '2026-07-16'))?.offers).toEqual([{ id: '1' }]);
		expect((await getCachedFoodOffers('canteenA', '2026-07-17'))?.offers).toEqual([{ id: '2' }]);
	});

	it('never caches a day beyond tomorrow', async () => {
		await cacheFoodOffers('canteenA', '2026-07-18', [{ id: '3' } as any]);

		expect(await getCachedFoodOffers('canteenA', '2026-07-18')).toBeNull();
	});

	it('wipes the previous canteen entirely when a different canteen is cached', async () => {
		await cacheFoodOffers('canteenA', '2026-07-16', [{ id: '1' } as any]);
		await cacheFoodOffers('canteenA', '2026-07-17', [{ id: '2' } as any]);

		await cacheFoodOffers('canteenB', '2026-07-16', [{ id: '9' } as any]);

		expect(await getCachedFoodOffers('canteenA', '2026-07-16')).toBeNull();
		expect(await getCachedFoodOffers('canteenA', '2026-07-17')).toBeNull();
		expect((await getCachedFoodOffers('canteenB', '2026-07-16'))?.offers).toEqual([{ id: '9' }]);
	});

	it('wipes the previous day when the current day rolls over', async () => {
		await cacheFoodOffers('canteenA', '2026-07-16', [{ id: '1' } as any]);

		jest.setSystemTime(new Date('2026-07-17T09:00:00'));
		await cacheFoodOffers('canteenA', '2026-07-17', [{ id: '2' } as any]);

		expect(await getCachedFoodOffers('canteenA', '2026-07-16')).toBeNull();
		expect((await getCachedFoodOffers('canteenA', '2026-07-17'))?.offers).toEqual([{ id: '2' }]);
	});
});
