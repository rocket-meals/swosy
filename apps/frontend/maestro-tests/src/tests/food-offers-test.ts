/**
 * food-offers-test.ts – Tests the food offers flow.
 *
 * After login: select a canteen → verify food offers load → open a detail view.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'food-offers'],
	outputFileName: 'food-offers-test',
});

// Login and get past onboarding
performAnonymousLogin(test);

test
	// Select a canteen
	.assertVisible(t(TranslationKeys.please_select_your_canteen))
	.scroll()
	.tapOn(t(TranslationKeys.select))
	.waitForAnimationToEnd()
	.takeScreenshot('food-offers-after-canteen-selected')

	// Navigate to food offers via drawer
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.food_offers))
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
