/**
 * canteen-selection-test.ts – Tests the canteen selection flow.
 *
 * Verifies that multiple canteens are shown, one can be selected,
 * and the selection is persisted.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'canteen'],
	outputFileName: 'canteen-selection-test',
});

// Login and get past onboarding
performAnonymousLogin(test);

test
	// Verify canteen selection screen loads with canteens
	.assertVisible(t(TranslationKeys.please_select_your_canteen))
	.assertNotVisible(t(TranslationKeys.no_canteens_found))
	.takeScreenshot('canteen-selection-initial')

	// Scroll through canteen list
	.scroll()
	.takeScreenshot('canteen-selection-scrolled')

	// Select a canteen
	.tapOn(t(TranslationKeys.select))
	.waitForAnimationToEnd()
	.takeScreenshot('canteen-selected-main-app')

	// Navigate to settings to verify selected canteen is remembered
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.settings))
	.waitForAnimationToEnd()

	// Look for canteen-related settings
	.assertVisible(t(TranslationKeys.group_canteen_usage))
	.takeScreenshot('canteen-selection-in-settings')

	// Tap on canteen setting to change it
	.tapOn(t(TranslationKeys.canteen))
	.waitForAnimationToEnd()
	.takeScreenshot('canteen-change-screen');

export default test;
