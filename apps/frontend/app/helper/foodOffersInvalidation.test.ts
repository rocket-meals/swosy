import { invalidateFoodOffers, subscribeFoodOffersInvalidation } from './foodOffersInvalidation';

describe('foodOffersInvalidation', () => {
	it('notifies every subscribed listener', () => {
		const first = jest.fn();
		const second = jest.fn();
		const unsubscribeFirst = subscribeFoodOffersInvalidation(first);
		const unsubscribeSecond = subscribeFoodOffersInvalidation(second);

		invalidateFoodOffers();

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
		unsubscribeFirst();
		unsubscribeSecond();
	});

	it('does not notify a listener after it unsubscribed', () => {
		const listener = jest.fn();
		const unsubscribe = subscribeFoodOffersInvalidation(listener);
		unsubscribe();

		invalidateFoodOffers();

		expect(listener).not.toHaveBeenCalled();
	});
});
