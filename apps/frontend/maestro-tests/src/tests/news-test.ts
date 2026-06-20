/**
 * news-test.ts – Tests the news screen.
 *
 * After login: navigate to news → verify content loads.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'news'],
	outputFileName: 'news-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
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
