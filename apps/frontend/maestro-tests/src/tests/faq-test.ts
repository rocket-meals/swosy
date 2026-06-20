/**
 * faq-test.ts – Tests the FAQ screen.
 *
 * After login: navigate to FAQ → verify categories load → browse content.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'faq'],
	outputFileName: 'faq-test',
});

// Login and get past onboarding
performAnonymousLogin(test);

test
	// Select a canteen
	.assertVisible(t(TranslationKeys.please_select_your_canteen))
	.scroll()
	.tapOn(t(TranslationKeys.select))
	.waitForAnimationToEnd()

	// Navigate to Settings → Feedback & Support → FAQ
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.settings))
	.waitForAnimationToEnd()

	// Scroll to find feedback/FAQ section
	.scroll()
	.scroll()
	.tapOn(t(TranslationKeys.feedback_and_support))
	.waitForAnimationToEnd()
	.takeScreenshot('faq-access-screen')

	// Tap on FAQ
	.tapOn(t(TranslationKeys.feedback_support_faq))
	.waitForAnimationToEnd()
	.takeScreenshot('faq-screen-loaded')

	// Scroll through FAQ content
	.scroll()
	.takeScreenshot('faq-scrolled')

	// Scroll further
	.scroll()
	.takeScreenshot('faq-scrolled-more');

export default test;
