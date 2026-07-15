import { persistor } from '@/redux/store';

// Dispatching to configureStore before redux-persist finishes rehydrating clobbers the
// persisted state: the persistor's store subscriber fires on every dispatch and writes
// whatever is in the store *right now* back to storage, so a dispatch that lands before
// rehydration completes overwrites "persist:root" with default/pre-rehydration state
// (this is what wiped every TestFlight user's data when persist:root moved to sqlite -
// sqlite's slower first-run openDatabaseAsync/CREATE TABLE widened the race window that
// AsyncStorage used to close in time). Run `fn` immediately once rehydration has already
// completed, or wait for it if it hasn't yet.
export function afterRehydration(fn: () => void): () => void {
	if (persistor.getState().bootstrapped) {
		fn();
		return () => {};
	}
	const unsubscribe = persistor.subscribe(() => {
		if (persistor.getState().bootstrapped) {
			unsubscribe();
			fn();
		}
	});
	return unsubscribe;
}
