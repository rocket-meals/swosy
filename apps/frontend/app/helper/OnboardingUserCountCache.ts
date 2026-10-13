import { UserHelper } from '@/helper/UserHelper';

// Allowed range of Intl.NumberFormat's minimumIntegerDigits (ECMA-402): values outside throw a RangeError.
const MIN_INTEGER_DIGITS_LOWER_LIMIT = 1;
const MIN_INTEGER_DIGITS_UPPER_LIMIT = 21;

// Only for the onboarding counter ("Schön, dass du dabei bist, wie auch 12.345"): caches the user
// count so the login screen and (app)/index can load it before the onboarding opens. The
// onboarding then knows the number of digits on its first render and starts at "00.000".
// The request itself lives in UserHelper.fetchUserCount.
export class OnboardingUserCountCache {
	private static cachedUserCount: number | null = null;
	private static pendingFetch: Promise<number | null> | null = null;

	static getCachedUserCount(): number | null {
		return OnboardingUserCountCache.cachedUserCount;
	}

	// Fetches the user count from the server and updates the cache. Concurrent calls share one
	// request. Resolves to null (and keeps the previous cache value) when the request fails.
	static fetchUserCount(): Promise<number | null> {
		if (OnboardingUserCountCache.pendingFetch) return OnboardingUserCountCache.pendingFetch;
		OnboardingUserCountCache.pendingFetch = (async () => {
			try {
				const count = await new UserHelper().fetchUserCount();
				if (count !== null) {
					OnboardingUserCountCache.cachedUserCount = count;
				}
				return count;
			} catch (error) {
				console.error('Error fetching user count:', error);
				return null;
			} finally {
				OnboardingUserCountCache.pendingFetch = null;
			}
		})();
		return OnboardingUserCountCache.pendingFetch;
	}

	// Formats a count locale-aware, left-padded with zeros to at least minDigits digits
	// (e.g. 0 with minDigits 5 -> "00.000" in German), so the number keeps its width while counting up.
	static formatPaddedCount(count: number, minDigits: number): string {
		return count.toLocaleString(undefined, { minimumIntegerDigits: Math.max(MIN_INTEGER_DIGITS_LOWER_LIMIT, Math.min(MIN_INTEGER_DIGITS_UPPER_LIMIT, minDigits)) });
	}
}
