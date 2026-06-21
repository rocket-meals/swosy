/**
 * feedback-test.ts – Tests the feedback/support screen.
 *
 * After login: navigate to feedback → verify FAQ option is visible → scroll.
 * Uses ComponentIds enum for stable element targeting via testIDs.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'feedback'],
	outputFileName: 'feedback-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	// Navigate to Settings (feedback is accessible from settings)
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_SETTINGS)
	.waitForAnimationToEnd()

	// Scroll to find FAQ/support option
	.scroll()
	.scroll()
	.assertVisibleId(ComponentIds.SETTINGS_FEEDBACK_SUPPORT_FAQ)
	.takeScreenshot('feedback-support-loaded')

	// Scroll through feedback options
	.scroll()
	.takeScreenshot('feedback-scrolled');

export default test;
