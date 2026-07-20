import { sqliteKeyValueStorage } from '@/redux/storage/sqliteStorage';
import { DatabaseTypes } from 'repo-depkit-common';

const CACHE_KEY_PREFIX = 'food_offers_cache_';

/**
 * Deterministic UTF-16 code unit comparator, independent of the runtime locale.
 */
function compareCodeUnits(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}
const TRACKER_KEY = 'food_offers_cache_tracker';
const META_KEY = 'food_offers_cache_meta';

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
    parts.sort(compareCodeUnits);
    return parts.join('|');
}

function getCacheKey(canteenId: string, date: string): string {
    return `${CACHE_KEY_PREFIX}${canteenId}_${date}`;
}

function toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns today's date as YYYY-MM-DD string in local time.
 */
function getTodayDateString(): string {
    return toDateString(new Date());
}

/**
 * Returns tomorrow's date as YYYY-MM-DD string in local time.
 */
function getTomorrowDateString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateString(tomorrow);
}

/**
 * Reads the tracker from storage.
 * Tracker shape: { [canteenId]: string[] }  (list of YYYY-MM-DD dates)
 */
async function getTracker(): Promise<Record<string, string[]>> {
    try {
        const raw = await sqliteKeyValueStorage.getItem(TRACKER_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error reading tracker', e);
    }
    return {};
}

async function setTracker(tracker: Record<string, string[]>): Promise<void> {
    try {
        await sqliteKeyValueStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error writing tracker', e);
    }
}

/**
 * Which canteen + day the currently cached entries belong to. Only one canteen's
 * data is ever meant to be cached at a time - see cacheFoodOffers() below.
 */
type CacheMeta = { canteenId: string; day: string };

async function getMeta(): Promise<CacheMeta | null> {
    try {
        const raw = await sqliteKeyValueStorage.getItem(META_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error reading cache meta', e);
    }
    return null;
}

async function setMeta(meta: CacheMeta): Promise<void> {
    try {
        await sqliteKeyValueStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e) {
        console.error('FoodOffersCacheHelper: Error writing cache meta', e);
    }
}

/**
 * Removes every tracked cached entry, for every canteen, and returns an empty tracker.
 * Used whenever the selected canteen or the current day changes, since only the
 * current+next day of the currently selected canteen are meant to stay cached.
 */
async function clearTrackedCache(tracker: Record<string, string[]>): Promise<Record<string, string[]>> {
    const keysToRemove = Object.entries(tracker).flatMap(([canteenId, dates]) =>
        dates.map(d => getCacheKey(canteenId, d))
    );
    if (keysToRemove.length > 0) {
        try {
            await sqliteKeyValueStorage.multiRemove(keysToRemove);
        } catch (e) {
            console.error('FoodOffersCacheHelper: Error clearing food offers cache', e);
        }
    }
    return {};
}

/**
 * Saves food offers for a specific canteen + date into storage - but only if
 * `date` is today or tomorrow. Only the current and next day of the currently
 * selected canteen are worth keeping offline; further scrolled-to days are still
 * fetched live, just never persisted. Whenever the selected canteen or the current
 * day differs from what's already cached, every previously cached entry is wiped
 * first instead of being left to linger.
 */
export async function cacheFoodOffers(
    canteenId: string,
    date: string,
    offers: DatabaseTypes.Foodoffers[],
): Promise<void> {
    try {
        const today = getTodayDateString();
        const tomorrow = getTomorrowDateString();
        if (date !== today && date !== tomorrow) {
            return;
        }

        const meta = await getMeta();
        let tracker = await getTracker();
        if (!meta || meta.canteenId !== canteenId || meta.day !== today) {
            tracker = await clearTrackedCache(tracker);
        }

        const hash = computeFoodOffersHash(offers);
        const cacheKey = getCacheKey(canteenId, date);
        await sqliteKeyValueStorage.setItem(cacheKey, JSON.stringify({ hash, offers }));

        const dates = tracker[canteenId] || [];
        if (!dates.includes(date)) {
            dates.push(date);
            // ISO date strings - deterministic code unit comparison sorts them chronologically
            dates.sort(compareCodeUnits);
            tracker[canteenId] = dates;
        }
        await setTracker(tracker);
        await setMeta({ canteenId, day: today });
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
 * Returns null if nothing is cached, or if `date` isn't today or tomorrow (see
 * cacheFoodOffers() - nothing else is meant to stay cached, including leftover
 * entries from before this policy existed).
 */
export async function getCachedFoodOffers(
    canteenId: string,
    date: string,
): Promise<CachedFoodOffersResult | null> {
    try {
        if (date !== getTodayDateString() && date !== getTomorrowDateString()) {
            return null;
        }

        const cacheKey = getCacheKey(canteenId, date);
        const raw = await sqliteKeyValueStorage.getItem(cacheKey);
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
