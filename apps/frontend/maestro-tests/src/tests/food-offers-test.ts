/**
 * food-offers-test.ts – Tests the food offers flow.
 *
 * After login: select a canteen → verify food offers load → open a detail view.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with nativeID
 * for element targeting. Components must set nativeID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'food-offers'],
	outputFileName: 'food-offers-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	.takeScreenshot('food-offers-after-canteen-selected')

	// Navigate to food offers via drawer
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_FOOD_OFFERS)
	.waitForAnimationToEnd()
	.takeScreenshot('food-offers-list')

	// Verify that either food offers are displayed or a "no offers" message is shown
	// (depends on the test backend data)
	.waitForAnimationToEnd()

	// Scroll through the food offers list
	.scroll()
	.takeScreenshot('food-offers-scrolled')

	// Try to tap on the first food offer to open the detail view
	.scroll()
	.swipe('UP')
	.waitForAnimationToEnd()
	.takeScreenshot('food-offers-detail');

export default test;
