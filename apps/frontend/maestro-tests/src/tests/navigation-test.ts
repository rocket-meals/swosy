/**
 * navigation-test.ts – Tests that the main navigation (drawer/tabs) works after login.
 *
 * After completing the anonymous login and selecting a canteen, verifies that
 * the user can open the drawer and navigate to different sections.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with testID
 * for element targeting. Components must set testID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'navigation'],
	outputFileName: 'navigation-test',
});

// Login and select a canteen to enter the main app
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	.takeScreenshot('navigation-main-screen')

	// Open the drawer
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.takeScreenshot('navigation-drawer-open')

	// Verify key navigation items are visible in the drawer
	.assertVisibleId(ComponentIds.DRAWER_ITEM_FOOD_OFFERS)
	.assertVisibleId(ComponentIds.DRAWER_ITEM_SETTINGS)

	// Navigate to Settings
	.tapOnId(ComponentIds.DRAWER_ITEM_SETTINGS)
	.waitForAnimationToEnd()
	.takeScreenshot('navigation-settings-screen')
	.assertVisibleId(ComponentIds.SETTINGS_GROUP_APP_SETTINGS)

	// Open drawer again and navigate to News
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_NEWS)
	.waitForAnimationToEnd()
	.takeScreenshot('navigation-news-screen')

	// Open drawer again and navigate to Food Offers
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_FOOD_OFFERS)
	.waitForAnimationToEnd()
	.takeScreenshot('navigation-food-offers-screen');

export default test;
