/**
 * settings-test.ts – Tests the settings screen.
 *
 * After login: navigate to settings → verify groups are visible →
 * change color scheme → verify UI change.
 *
 * SCREEN ELEMENTS AND EXPECTED TEXT STRINGS:
 * - Uses translation keys from TranslationKeys enum, never hardcoded strings
 * - Uses ComponentIds enum for stable element IDs (e.g. open_drawer button)
 * - Key screen texts (via t() function):
 *   - open_drawer: Uses ComponentIds.OPEN_DRAWER for stable tap target
 *   - settings: Enters settings screen
 *   - group_app_settings: "App Settings" section header
 *   - color_scheme: Color scheme setting option
 *   - color_scheme_dark: "Dark Mode" option
 *   - color_scheme_light: "Light Mode" option
 *   - language: Language setting option
 *   - All lookups use t() to fetch German translations by default
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { t, performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

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
	.assertVisible(t(TranslationKeys.group_app_settings))

	// Scroll to see more settings
	.scroll()
	.takeScreenshot('settings-scrolled')

	// Tap on color scheme setting
	.tapOn(t(TranslationKeys.color_scheme))
	.waitForAnimationToEnd()
	.takeScreenshot('settings-color-scheme-options')

	// Select dark mode
	.tapOn(t(TranslationKeys.color_scheme_dark))
	.waitForAnimationToEnd()
	.takeScreenshot('settings-dark-mode-applied')

	// Switch back to light mode
	.tapOn(t(TranslationKeys.color_scheme))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.color_scheme_light))
	.waitForAnimationToEnd()
	.takeScreenshot('settings-light-mode-applied')

	// Test language setting
	.tapOn(t(TranslationKeys.language))
	.waitForAnimationToEnd()
	.takeScreenshot('settings-language-options');

export default test;
