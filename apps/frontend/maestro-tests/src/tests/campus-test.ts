/**
 * campus-test.ts – Tests the campus information screen.
 *
 * After login: navigate to campus → verify content loads → check details.
 *
 * SCREEN ELEMENTS AND EXPECTED TEXT STRINGS:
 * - Uses translation keys from TranslationKeys enum, never hardcoded strings
 * - Uses ComponentIds enum for stable element IDs (e.g. open_drawer button)
 * - Key screen texts (via t() function):
 *   - open_drawer: Uses ComponentIds.OPEN_DRAWER for stable tap target
 *   - campus: "Campus" navigation option
 *   - no_campus_found: "No campus found" message (should NOT be visible when content loads)
 *   - All lookups use t() to fetch German translations by default
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { t, performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'campus'],
	outputFileName: 'campus-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	// Navigate to Campus
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.campus))
	.waitForAnimationToEnd()
	.takeScreenshot('campus-screen-loaded')

	// Verify campus content is loaded (not showing "no campus found")
	.assertNotVisible(t(TranslationKeys.no_campus_found))

	// Scroll through campus items
	.scroll()
	.takeScreenshot('campus-scrolled')

	// Scroll further to see more
	.scroll()
	.takeScreenshot('campus-scrolled-more');

export default test;
