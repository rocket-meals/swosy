/**
 * round-navigation-test.ts – Starts a 2-guest game, enters a score for round 1,
 * then verifies the split "← Runde X-1 | Runde X+1 →" navigation moves between
 * rounds and that going back shows round 1 again.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { ComponentIds } from '../../../frontend/constants/ComponentIds';

const test = new MaestroTestCase({
	appId: 'com.scoretracker.web',
	tags: ['web', 'round-navigation'],
	outputFileName: 'round-navigation-test',
});

test
	.openPage('http://localhost:8082/')
	.waitForAnimationToEnd()

	// Setup: two guest players, then start the game
	.tapOnId(ComponentIds.GAME_ADD_PLAYER_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.GAME_ADD_PLAYER_GUEST_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.GAME_ADD_PLAYER_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.GAME_ADD_PLAYER_GUEST_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.GAME_START_BUTTON)
	.waitForAnimationToEnd()
	.assertVisible('Runde 1')

	// Enter a score for the first player in round 1
	.tapOnIdIndex(ComponentIds.GAME_PLAYER_TILE_PREFIX, 0)
	.waitForAnimationToEnd()
	.inputText('10')
	.tapOnId(ComponentIds.GAME_SCORE_INPUT_SAVE_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('round-1-player-1-scored')

	// Move to round 2 (created on demand)
	.tapOnId(ComponentIds.GAME_ROUND_NEXT_BUTTON)
	.waitForAnimationToEnd()
	.assertVisible('Runde 2')
	.takeScreenshot('round-2')

	// Move back to round 1
	.tapOnId(ComponentIds.GAME_ROUND_PREV_BUTTON)
	.waitForAnimationToEnd()
	.assertVisible('Runde 1')
	.takeScreenshot('round-nav-back-to-round-1');

export default test;
