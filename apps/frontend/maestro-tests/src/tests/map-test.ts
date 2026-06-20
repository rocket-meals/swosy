/**
 * map-test.ts – Tests the map screen.
 *
 * After login: navigate to map → verify it renders.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t, performAnonymousLogin, selectFirstCanteen } from '../framework/loginHelper';

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
	.tapOn(t(TranslationKeys.open_drawer))
	.waitForAnimationToEnd()
	.tapOn(t(TranslationKeys.map))
	.waitForAnimationToEnd()
	.takeScreenshot('map-screen-loaded')

	// Wait a bit more for map tiles to load
	.waitForAnimationToEnd()
	.takeScreenshot('map-fully-loaded')

	// Verify map variants option is available
	.tapOn(t(TranslationKeys.map_variants))
	.waitForAnimationToEnd()
	.takeScreenshot('map-variants-options');

export default test;
