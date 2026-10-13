import { UserHelper } from '@/helper/UserHelper';

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
}
