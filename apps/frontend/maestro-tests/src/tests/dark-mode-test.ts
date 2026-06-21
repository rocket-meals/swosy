/**
 * dark-mode-test.ts – Tests dark mode activation and visual change.
 *
 * After login: navigate to settings → activate dark mode → take screenshots
 * for visual comparison.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with nativeID
 * for element targeting. Components must set nativeID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'dark-mode'],
	outputFileName: 'dark-mode-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	// Navigate to Settings
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_SETTINGS)
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-before-light')

	// Tap on color scheme
	.tapOnId(ComponentIds.SETTINGS_COLOR_SCHEME)
	.waitForAnimationToEnd()

	// Select dark mode
	.tapOnId(ComponentIds.COLOR_SCHEME_DARK)
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-settings-dark')

	// Go back to main screen to see dark mode in effect
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-drawer-dark')
	.tapOnId(ComponentIds.DRAWER_ITEM_FOOD_OFFERS)
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-food-offers-dark')

	// Switch back to light for comparison
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_SETTINGS)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.SETTINGS_COLOR_SCHEME)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.COLOR_SCHEME_LIGHT)
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-back-to-light');

export default test;
