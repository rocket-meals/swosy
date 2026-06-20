/**
 * news-test.ts – Tests the news screen.
 *
 * After login: navigate to news → verify content loads.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'news'],
	outputFileName: 'news-test',
});

// Login and get past onboarding
performAnonymousLogin(test);

test
	// Select a canteen
	.assertVisible(t(TranslationKeys.please_select_your_canteen))
	.scroll()
	.tapOn(t(TranslationKeys.select))
	.waitForAnimationToEnd()

	// Navigate to News
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.news))
	.waitForAnimationToEnd()
	.takeScreenshot('news-screen-loaded')

	// Scroll through news items
	.scroll()
	.takeScreenshot('news-scrolled')

	// Scroll further
	.scroll()
	.takeScreenshot('news-scrolled-more');

export default test;
