/**
 * Tells the food offer list that the offers it shows are outdated.
 *
 * The food import replaces a changed food offer by a new one with a new id. A list
 * that was loaded before the import still holds the old id, and opening it then
 * fails. The details view calls `invalidateFoodOffers()` in that case, and the
 * list reloads from the server.
 */
type FoodOffersInvalidationListener = () => void;

const listeners = new Set<FoodOffersInvalidationListener>();

/** Registers a listener; returns the function that removes it again. */
export function subscribeFoodOffersInvalidation(listener: FoodOffersInvalidationListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function invalidateFoodOffers(): void {
	listeners.forEach((listener) => listener());
}
