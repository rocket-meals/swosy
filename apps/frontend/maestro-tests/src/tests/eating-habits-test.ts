/**
 * eating-habits-test.ts – Tests the eating habits / allergene settings.
 *
 * After login: navigate to eating habits → verify screen loads → scroll.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with testID
 * for element targeting. Components must set testID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'eating-habits'],
	outputFileName: 'eating-habits-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	// Navigate to settings
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_SETTINGS)
	.waitForAnimationToEnd()

	// Find and tap on eating habits
	.scroll()
	.tapOnId(ComponentIds.SETTINGS_EATING_HABITS)
	.waitForAnimationToEnd()
	.takeScreenshot('eating-habits-screen')

	// Verify markings section is visible
	.assertVisibleId(ComponentIds.EATING_HABITS_MARKINGS)
	.takeScreenshot('eating-habits-markings')

	// Scroll through options
	.scroll()
	.takeScreenshot('eating-habits-scrolled')

	// Scroll further
	.scroll()
	.takeScreenshot('eating-habits-scrolled-more');

export default test;
