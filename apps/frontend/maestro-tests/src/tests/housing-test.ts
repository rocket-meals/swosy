/**
 * housing-test.ts – Tests the housing/apartments screen.
 *
 * After login: navigate to housing → verify list loads → check details.
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with nativeID
 * for element targeting. Components must set nativeID={ComponentIds.XXX} so that
 * Maestro web tests can locate elements by their id attribute.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

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
	.tapOnId(ComponentIds.DRAWER_ITEM_HOUSING)
	.waitForAnimationToEnd()
	.takeScreenshot('housing-screen-loaded')

	// Scroll through housing list
	.scroll()
	.takeScreenshot('housing-list-scrolled')

	// Search for apartments
	.tapOnId(ComponentIds.HOUSING_SEARCH)
	.waitForAnimationToEnd()
	.takeScreenshot('housing-search-active')

	// Scroll more
	.scroll()
	.takeScreenshot('housing-more-results');

export default test;
