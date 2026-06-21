/**
 * eating-habits-test.ts – Tests the eating habits / allergene settings.
 *
 * After login: navigate to eating habits → set preferences →
 * verify markings are available.
 *
 * SCREEN ELEMENTS AND EXPECTED TEXT STRINGS:
 * - Uses translation keys from TranslationKeys enum, never hardcoded strings
 * - Uses ComponentIds enum for stable element IDs (e.g. open_drawer button)
 * - Key screen texts (via t() function):
 *   - open_drawer: Uses ComponentIds.OPEN_DRAWER for stable tap target
 *   - settings: Enters settings screen
 *   - eating_habits: "Eating Habits" setting option
 *   - markings: "Markings" / "Allergies" section
 *   - All lookups use t() to fetch German translations by default
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { t, performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

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
	.tapOn(t(TranslationKeys.eating_habits))
	.waitForAnimationToEnd()
	.takeScreenshot('eating-habits-screen')

	// Verify markings/allergene section is visible
	.assertVisible(t(TranslationKeys.markings))
	.takeScreenshot('eating-habits-markings')

	// Scroll through options
	.scroll()
	.takeScreenshot('eating-habits-scrolled')

	// Tap on allergene section
	.tapOn(t(TranslationKeys.allergene))
	.waitForAnimationToEnd()
	.takeScreenshot('eating-habits-allergene');

export default test;
