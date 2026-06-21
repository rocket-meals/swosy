/**
 * canteen-selection-test.ts – Tests the canteen selection flow.
 *
 * Verifies that multiple canteens are shown, one can be selected,
 * and the selection is persisted.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with nativeID
 * for element targeting. Components must set nativeID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'canteen'],
	outputFileName: 'canteen-selection-test',
});

// Login and get past onboarding
performAnonymousLogin(test);

test
	// Verify canteen selection screen loads with canteens
	.assertVisibleId(ComponentIds.CANTEEN_SELECTION_TITLE)
	.assertNotVisibleId(ComponentIds.CANTEEN_SELECTION_EMPTY)
	.takeScreenshot('canteen-selection-initial')

	// Scroll through canteen list
	.scroll()
	.takeScreenshot('canteen-selection-scrolled')

	// Select a canteen
	.tapOnId(`${ComponentIds.CANTEEN_SELECT_BUTTON}.*`)
	.waitForAnimationToEnd()
	.takeScreenshot('canteen-selected-main-app')

	// Navigate to settings to verify selected canteen is remembered
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_SETTINGS)
	.waitForAnimationToEnd()

	// Look for canteen-related settings
	.assertVisibleId(ComponentIds.SETTINGS_GROUP_CANTEEN_USAGE)
	.takeScreenshot('canteen-selection-in-settings')

	// Tap on canteen setting to change it
	.tapOnId(ComponentIds.SETTINGS_CANTEEN)
	.waitForAnimationToEnd()
	.takeScreenshot('canteen-change-screen');

export default test;
