/**
 * setup-flow-test.ts – Tests the round-0 setup phase: starting from an empty
 * game, add two guest players via the "+ Spieler hinzufügen" chooser, then
 * start the game and confirm round 1 begins.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { CommonUiComponentIds } from 'repo-depkit-common-ui/src/constants/ComponentIds';
import { ComponentIds } from '../../../frontend/constants/ComponentIds';

const test = new MaestroTestCase({
	appId: 'com.scoretracker.web',
	tags: ['web', 'setup-flow'],
	outputFileName: 'setup-flow-test',
});

test
	.openPage('http://localhost:8082/')
	.waitForAnimationToEnd()
	// First launch shows the onboarding tour - skip it (no-op when already dismissed)
	.optionalTapOnId(ComponentIds.ONBOARDING_SKIP_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('setup-empty')

	// Add two guest players - the chooser stays open between adds and shows
	// each guest in its "Ausgewählte Spieler" section
	.tapOnId(ComponentIds.GAME_ADD_PLAYER_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.GAME_ADD_PLAYER_GUEST_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.GAME_ADD_PLAYER_GUEST_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('setup-chooser-two-guests')
	.tapOnId(CommonUiComponentIds.MODAL_CLOSE_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('setup-two-guests')

	// Start the game
	.assertVisibleId(ComponentIds.GAME_START_BUTTON)
	.tapOnId(ComponentIds.GAME_START_BUTTON)
	.waitForAnimationToEnd()
	.assertVisible('Runde 1')
	.takeScreenshot('game-round-1-started');

export default test;
