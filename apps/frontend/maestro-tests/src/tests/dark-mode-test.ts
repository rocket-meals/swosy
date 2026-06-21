/**
 * dark-mode-test.ts – Tests dark mode activation and visual change.
 *
 * After login: navigate to settings → activate dark mode → take screenshots
 * for visual comparison.
 *
 * SCREEN ELEMENTS AND EXPECTED TEXT STRINGS:
 * - Uses translation keys from TranslationKeys enum, never hardcoded strings
 * - Uses ComponentIds enum for stable element IDs (e.g. open_drawer button)
 * - Key screen texts (via t() function):
 *   - open_drawer: Uses ComponentIds.OPEN_DRAWER for stable tap target
 *   - settings: Enters settings screen
 *   - color_scheme: Color scheme setting option
 *   - color_scheme_dark: "Dark Mode" option
 *   - color_scheme_light: "Light Mode" option
 *   - All lookups use t() to fetch German translations by default
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { t, performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

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
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-drawer-dark')
	.tapOn(t(TranslationKeys.food_offers))
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-food-offers-dark')

	// Switch back to light for comparison
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.settings))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.color_scheme))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.color_scheme_light))
	.waitForAnimationToEnd()
	.takeScreenshot('dark-mode-back-to-light');

export default test;
