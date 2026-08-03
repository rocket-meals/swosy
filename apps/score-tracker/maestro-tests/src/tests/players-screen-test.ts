/**
 * players-screen-test.ts – Tests the "Spieler" (friends) screen: create a new
 * friend from the header "+" button, land on the detail screen, then delete it.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { ComponentIds } from '../../../frontend/constants/ComponentIds';

const test = new MaestroTestCase({
	appId: 'com.scoretracker.web',
	tags: ['web', 'players-screen'],
	outputFileName: 'players-screen-test',
});

test
	.openPage('http://localhost:8082/players')
	.waitForAnimationToEnd()
	// First launch shows the onboarding tour - skip it (no-op when already dismissed)
	.optionalTapOnId(ComponentIds.ONBOARDING_SKIP_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('players-empty')

	// Create a new friend - navigates straight to its detail screen
	.tapOnId(ComponentIds.PLAYERS_SCREEN_ADD_BUTTON)
	.waitForAnimationToEnd()
	.assertVisibleId(ComponentIds.PLAYER_DETAIL_DELETE_BUTTON)
	.takeScreenshot('player-detail-created')

	// Delete the friend again - navigates back to the (now empty) list
	.tapOnId(ComponentIds.PLAYER_DETAIL_DELETE_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('players-after-delete');

export default test;
