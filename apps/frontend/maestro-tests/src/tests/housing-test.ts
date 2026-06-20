/**
 * housing-test.ts – Tests the housing/apartments screen.
 *
 * After login: navigate to housing → verify list loads → check details.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'housing'],
	outputFileName: 'housing-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	// Navigate to Housing
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.housing))
	.waitForAnimationToEnd()
	.takeScreenshot('housing-screen-loaded')

	// Scroll through housing list
	.scroll()
	.takeScreenshot('housing-list-scrolled')

	// Search for apartments
	.tapOn(t(TranslationKeys.search_apartment_here))
	.waitForAnimationToEnd()
	.takeScreenshot('housing-search-active')

	// Scroll more
	.scroll()
	.takeScreenshot('housing-more-results');

export default test;
