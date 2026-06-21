/**
 * housing-test.ts – Tests the housing/apartments screen.
 *
 * After login: navigate to housing → verify list loads → check details.
 *
 * SCREEN ELEMENTS AND EXPECTED TEXT STRINGS:
 * - Uses translation keys from TranslationKeys enum, never hardcoded strings
 * - Uses ComponentIds enum for stable element IDs (e.g. open_drawer button)
 * - Key screen texts (via t() function):
 *   - open_drawer: Uses ComponentIds.OPEN_DRAWER for stable tap target
 *   - housing: "Housing" navigation option
 *   - search_apartment_here: "Search apartment here" option
 *   - All lookups use t() to fetch German translations by default
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { ComponentIds } from '../../../app/constants/ComponentIds';
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
	.tapOnId(ComponentIds.OPEN_DRAWER)
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
