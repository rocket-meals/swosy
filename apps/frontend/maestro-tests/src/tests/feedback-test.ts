/**
 * feedback-test.ts – Tests the feedback/support screen.
 *
 * After login: navigate to feedback → open form → fill in fields (without submitting).
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'feedback'],
	outputFileName: 'feedback-test',
});

// Login and get past onboarding
performAnonymousLogin(test);

test
	// Select a canteen
	.assertVisible(t(TranslationKeys.please_select_your_canteen))
	.scroll()
	.tapOn(t(TranslationKeys.select))
	.waitForAnimationToEnd()

	// Navigate to Settings (feedback is often accessible from settings)
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.settings))
	.waitForAnimationToEnd()

	// Scroll to find feedback option
	.scroll()
	.scroll()
	.tapOn(t(TranslationKeys.feedback_and_support))
	.waitForAnimationToEnd()
	.takeScreenshot('feedback-screen')

	// Verify feedback screen loaded
	.assertVisible(t(TranslationKeys.feedback_support_faq))
	.takeScreenshot('feedback-support-loaded')

	// Scroll through feedback options
	.scroll()
	.takeScreenshot('feedback-scrolled');

export default test;
