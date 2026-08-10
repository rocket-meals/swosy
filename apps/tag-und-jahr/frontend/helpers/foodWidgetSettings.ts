import Storage from 'expo-sqlite/kv-store';
import { FoodServerKey } from './foodServers';

// Persisted configuration of the experimental food widget. Deliberately tiny:
// one JSON blob in expo-sqlite's key-value store.

export type FoodWidgetSettings = {
	serverKey: FoodServerKey;
	canteenId: string;
	canteenAlias: string;
	/** Meals shown at once (per widget "page"). */
	mealCount: number;
};

const STORAGE_KEY = 'foodWidgetSettings.v1';

export async function loadFoodWidgetSettingsAsync(): Promise<FoodWidgetSettings | null> {
	try {
		const raw = await Storage.getItem(STORAGE_KEY);
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as FoodWidgetSettings;
		if (!parsed.serverKey || !parsed.canteenId) {
			return null;
		}
		return { ...parsed, mealCount: parsed.mealCount ?? 4 };
	} catch (error) {
		console.warn('[foodWidgetSettings] load failed:', error);
		return null;
	}
}

export async function saveFoodWidgetSettingsAsync(settings: FoodWidgetSettings): Promise<void> {
	await Storage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
