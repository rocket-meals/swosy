/**
 * map-test.ts – Tests the map screen.
 *
 * After login: navigate to map → verify it renders.
 * Uses ComponentIds enum for stable element targeting via testIDs.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'map'],
	outputFileName: 'map-test',
});

// Login and select a canteen
performAnonymousLogin(test);
selectFirstCanteen(test);

test
	// Navigate to Map
	.tapOnId(ComponentIds.OPEN_DRAWER)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.DRAWER_ITEM_MAP)
	.waitForAnimationToEnd()
	.takeScreenshot('map-screen-loaded')

	// Wait a bit more for map tiles to load
	.waitForAnimationToEnd()
	.takeScreenshot('map-fully-loaded');

export default test;
