/**
 * settings-test.ts – Tests the settings screen.
 *
 * After login: navigate to settings → verify groups are visible →
 * change color scheme → verify UI change.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with testID
 * for element targeting. Components must set testID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'settings'],
	outputFileName: 'settings-test',
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
	.takeScreenshot('settings-main')

	// Verify settings groups are visible
	.assertVisibleId(ComponentIds.SETTINGS_GROUP_APP_SETTINGS)

	// Scroll to see more settings
	.scroll()
	.takeScreenshot('settings-scrolled')

	// Tap on color scheme setting
	.tapOnId(ComponentIds.SETTINGS_COLOR_SCHEME)
	.waitForAnimationToEnd()
	.takeScreenshot('settings-color-scheme-options')

	// Select dark mode
	.tapOnId(ComponentIds.COLOR_SCHEME_DARK)
	.waitForAnimationToEnd()
	.takeScreenshot('settings-dark-mode-applied')

	// Switch back to light mode
	.tapOnId(ComponentIds.SETTINGS_COLOR_SCHEME)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.COLOR_SCHEME_LIGHT)
	.waitForAnimationToEnd()
	.takeScreenshot('settings-light-mode-applied')

	// Test language setting
	.tapOnId(ComponentIds.SETTINGS_LANGUAGE)
	.waitForAnimationToEnd()
	.takeScreenshot('settings-language-options');

export default test;
