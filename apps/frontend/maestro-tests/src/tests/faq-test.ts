/**
 * faq-test.ts – Tests the FAQ screen.
 *
 * After login: navigate to FAQ → verify categories load → browse content.
 * Uses ComponentIds enum for stable element targeting via testIDs.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'faq'],
	outputFileName: 'faq-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	// Navigate to Settings → Feedback & Support → FAQ
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_SETTINGS)
	.waitForAnimationToEnd()

	// Scroll to find FAQ section and tap on it
	.scroll()
	.scroll()
	.tapOnId(ComponentIds.SETTINGS_FEEDBACK_SUPPORT_FAQ)
	.waitForAnimationToEnd()
	.takeScreenshot('faq-screen-loaded')

	// Scroll through FAQ content
	.scroll()
	.takeScreenshot('faq-scrolled')

	// Scroll further
	.scroll()
	.takeScreenshot('faq-scrolled-more');

export default test;
