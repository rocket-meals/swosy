/**
 * news-test.ts – Tests the news screen.
 *
 * After login: navigate to news → verify content loads.
 *
 * SCREEN ELEMENTS AND EXPECTED TEXT STRINGS:
 * - Uses translation keys from TranslationKeys enum, never hardcoded strings
 * - Uses ComponentIds enum for stable element IDs (e.g. open_drawer button)
 * - Key screen texts (via t() function):
 *   - open_drawer: Uses ComponentIds.OPEN_DRAWER for stable tap target
 *   - news: "News" navigation option
 *   - All lookups use t() to fetch German translations by default
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { ComponentIds } from '../../../app/constants/ComponentIds';
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
	.tapOnId(ComponentIds.OPEN_DRAWER)
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
