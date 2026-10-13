import { UserHelper } from '@/redux/actions/User/UserHelper';

// In-memory cache of the total user count shown in the onboarding ("Du und 12.345 andere").
// The login screen prefetches it, so the onboarding already knows how many digits the number
// has on its first render and can start its counter at a zero-padded value ("00.000").
export class UserCountHelper {
	private static cachedUserCount: number | null = null;
	private static pendingFetch: Promise<number | null> | null = null;

	static getCachedUserCount(): number | null {
		return UserCountHelper.cachedUserCount;
	}

	// Fetches the user count from the server and updates the cache. Concurrent calls share one
	// request. Resolves to null (and keeps the previous cache value) when the request fails.
	static fetchUserCount(): Promise<number | null> {
		if (UserCountHelper.pendingFetch) return UserCountHelper.pendingFetch;
		UserCountHelper.pendingFetch = (async () => {
			try {
				const count = await new UserHelper().fetchUserCount();
				if (count !== null) {
					UserCountHelper.cachedUserCount = count;
				}
				return count;
			} catch (error) {
				console.error('Error fetching user count:', error);
				return null;
			} finally {
				UserCountHelper.pendingFetch = null;
			}
		})();
		return UserCountHelper.pendingFetch;
	}

	// Formats a count locale-aware, left-padded with zeros to at least minDigits digits
	// (e.g. 0 with minDigits 5 -> "00.000" in German), so the number keeps its width while counting up.
	static formatPaddedCount(count: number, minDigits: number): string {
		return count.toLocaleString(undefined, { minimumIntegerDigits: Math.max(1, Math.min(21, minDigits)) });
	}
}
