import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseTypes } from 'repo-depkit-common';

const CACHE_KEY_PREFIX = 'food_offers_cache_';
const TRACKER_KEY = 'food_offers_cache_tracker';

/**
 * Generates a simple hash string for an array of food offers.
 * Used to compare cached vs. server data to avoid unnecessary re-renders.
 */
export function computeFoodOffersHash(offers: DatabaseTypes.Foodoffers[]): string {
    if (!offers || offers.length === 0) return 'empty';
    // Use ids + result_hash (or date_updated fallback) to create a lightweight fingerprint
    const parts = offers.map(o => `${o.id}:${o.result_hash || o.date_updated || ''}`);
    // Deterministic UTF-16 code unit comparison - fingerprint parts are technical IDs,
    // so the order must not depend on the runtime locale.
    parts.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return parts.join('|');
}

function getCacheKey(canteenId: string, date: string): string {
    return `${CACHE_KEY_PREFIX}${canteenId}_${date}`;
}

/**
 * Returns today's date as YYYY-MM-DD string in local time.
 */
function getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Reads the tracker from AsyncStorage.
 * Tracker shape: { [canteenId]: string[] }  (list of YYYY-MM-DD dates)
 */
async function getTracker(): Promise<Record<string, string[]>> {
    try {
        const raw = await AsyncStorage.getItem(TRACKER_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error reading tracker', e);
    }
    return {};
}

async function setTracker(tracker: Record<string, string[]>): Promise<void> {
    try {
        await AsyncStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error writing tracker', e);
    }
}

/**
 * Removes cached entries for dates that are in the past for the given canteen.
 */
async function cleanupPastDates(canteenId: string, tracker: Record<string, string[]>): Promise<Record<string, string[]>> {
    const today = getTodayDateString();
    const dates = tracker[canteenId];
    if (!dates || dates.length === 0) return tracker;

    const pastDates = dates.filter(d => d < today);
    const futureDates = dates.filter(d => d >= today);

    if (pastDates.length > 0) {
        const keysToRemove = pastDates.map(d => getCacheKey(canteenId, d));
        try {
            await AsyncStorage.multiRemove(keysToRemove);
        } catch (e) {
            console.error('FoodOffersCacheHelper: Error removing past dates', e);
        }
    }

    const updated = { ...tracker, [canteenId]: futureDates };
    return updated;
}

/**
 * Saves food offers for a specific canteen + date into AsyncStorage.
 * Also updates the tracker and cleans up past dates.
 */
export async function cacheFoodOffers(
    canteenId: string,
    date: string,
    offers: DatabaseTypes.Foodoffers[],
): Promise<void> {
    try {
        const hash = computeFoodOffersHash(offers);
        const cacheKey = getCacheKey(canteenId, date);
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ hash, offers }));

        let tracker = await getTracker();
        // Cleanup past dates for this canteen
        tracker = await cleanupPastDates(canteenId, tracker);
        // Add current date if not already tracked
        const dates = tracker[canteenId] || [];
        if (!dates.includes(date)) {
            dates.push(date);
            // ISO date strings - deterministic code unit comparison sorts them chronologically
            dates.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
            tracker[canteenId] = dates;
        }
        await setTracker(tracker);
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error caching food offers', e);
    }
}

export interface CachedFoodOffersResult {
    offers: DatabaseTypes.Foodoffers[];
    hash: string;
}

/**
 * Loads cached food offers for a specific canteen + date.
 * Returns null if nothing is cached.
 */
export async function getCachedFoodOffers(
    canteenId: string,
    date: string,
): Promise<CachedFoodOffersResult | null> {
    try {
        const cacheKey = getCacheKey(canteenId, date);
        const raw = await AsyncStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return {
            offers: parsed.offers || [],
            hash: parsed.hash || '',
        };
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error reading cached food offers', e);
        return null;
    }
}
