/**
 * news-test.ts – Tests the news screen.
 *
 * After login: navigate to news → verify content loads.
 * Uses ComponentIds enum for stable element targeting via testIDs.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

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
	.tapOnId(ComponentIds.DRAWER_ITEM_NEWS)
	.waitForAnimationToEnd()
	.takeScreenshot('news-screen-loaded')

	// Scroll through news items
	.scroll()
	.takeScreenshot('news-scrolled')

	// Scroll further
	.scroll()
	.takeScreenshot('news-scrolled-more');

export default test;
