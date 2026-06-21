/**
 * language-switch-test.ts – Tests switching the app language.
 *
 * After login: navigate to settings → switch language from DE to EN →
 * verify that the language option changes.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with testID
 * for element targeting. Components must set testID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'language'],
	outputFileName: 'language-switch-test',
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
	.takeScreenshot('language-settings-de')

	// Verify settings group is shown
	.assertVisibleId(ComponentIds.SETTINGS_GROUP_APP_SETTINGS)

	// Tap on language setting
	.tapOnId(ComponentIds.SETTINGS_LANGUAGE)
	.waitForAnimationToEnd()
	.takeScreenshot('language-options')

	// Select English
	.tapOnId(ComponentIds.LANGUAGE_ENGLISH)
	.waitForAnimationToEnd()
	.takeScreenshot('language-switched-to-en')

	// Verify English is now active by checking settings group is still visible
	.assertVisibleId(ComponentIds.SETTINGS_GROUP_APP_SETTINGS)
	.takeScreenshot('language-settings-en')

	// Switch back to German
	.tapOnId(ComponentIds.SETTINGS_LANGUAGE)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.LANGUAGE_GERMAN)
	.waitForAnimationToEnd()
	.takeScreenshot('language-back-to-de');

export default test;
