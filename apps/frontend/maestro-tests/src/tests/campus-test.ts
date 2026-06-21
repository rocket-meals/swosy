/**
 * campus-test.ts – Tests the campus information screen.
 *
 * After login: navigate to campus → verify content loads → check details.
 * Uses ComponentIds enum for stable element targeting via testIDs.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

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
	.tapOnId(ComponentIds.DRAWER_ITEM_CAMPUS)
	.waitForAnimationToEnd()
	.takeScreenshot('campus-screen-loaded')

	// Verify campus content is loaded (not showing "no campus found")
	.assertNotVisibleId(ComponentIds.CAMPUS_EMPTY)

	// Scroll through campus items
	.scroll()
	.takeScreenshot('campus-scrolled')

	// Scroll further to see more
	.scroll()
	.takeScreenshot('campus-scrolled-more');

export default test;
