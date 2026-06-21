/**
 * map-test.ts – Tests the map screen.
 *
 * After login: navigate to map → verify it renders.
 *
 * SCREEN ELEMENTS AND EXPECTED TEXT STRINGS:
 * - Uses translation keys from TranslationKeys enum, never hardcoded strings
 * - Uses ComponentIds enum for stable element IDs (e.g. open_drawer button)
 * - Key screen texts (via t() function):
 *   - open_drawer: Uses ComponentIds.OPEN_DRAWER for stable tap target
 *   - map: "Map" navigation option
 *   - map_variants: Map variants/style selector option
 *   - All lookups use t() to fetch German translations by default
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { ComponentIds } from '../../../app/constants/ComponentIds';
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
	.tapOnId(ComponentIds.OPEN_DRAWER)
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
