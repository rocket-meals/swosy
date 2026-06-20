/**
 * language-switch-test.ts – Tests switching the app language.
 *
 * After login: navigate to settings → switch language from DE to EN →
 * verify that translated texts change.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'language'],
	outputFileName: 'language-switch-test',
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
	.takeScreenshot('language-settings-de')

	// Verify German text is shown
	.assertVisible(t(TranslationKeys.group_app_settings, 'de'))

	// Tap on language setting
	.tapOn(t(TranslationKeys.language))
	.waitForAnimationToEnd()
	.takeScreenshot('language-options')

	// Select English
	.tapOn('English')
	.waitForAnimationToEnd()
	.takeScreenshot('language-switched-to-en')

	// Verify English text is now shown
	.assertVisible(t(TranslationKeys.group_app_settings, 'en'))
	.takeScreenshot('language-settings-en')

	// Switch back to German
	.tapOn(t(TranslationKeys.language, 'en'))
	.waitForAnimationToEnd()
	.tapOn('Deutsch')
	.waitForAnimationToEnd()
	.takeScreenshot('language-back-to-de');

export default test;
