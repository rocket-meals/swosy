/**
 * campus-test.ts – Tests the campus information screen.
 *
 * After login: navigate to campus → verify content loads → check details.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
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
	.tapOn(t(TranslationKeys.open_drawer))
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
