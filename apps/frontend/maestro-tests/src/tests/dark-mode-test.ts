/**
 * dark-mode-test.ts – Tests dark mode activation and visual change.
 *
 * After login: navigate to settings → activate dark mode → take screenshots
 * for visual comparison.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'dark-mode'],
	outputFileName: 'dark-mode-test',
});

// Login and get past onboarding
performAnonymousLogin(test);

test
	// Select a canteen
	.assertVisible(t(TranslationKeys.please_select_your_canteen))
	.scroll()
	.tapOn(t(TranslationKeys.select))
	.waitForAnimationToEnd()

	// Navigate to Settings
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.settings))
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-before-light')

	// Tap on color scheme
	.tapOn(t(TranslationKeys.color_scheme))
	.waitForAnimationToEnd()

	// Select dark mode
	.tapOn(t(TranslationKeys.color_scheme_dark))
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-settings-dark')

	// Go back to main screen to see dark mode in effect
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-drawer-dark')
	.tapOn(t(TranslationKeys.food_offers))
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-food-offers-dark')

	// Switch back to light for comparison
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.settings))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.color_scheme))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.color_scheme_light))
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-back-to-light');

export default test;
