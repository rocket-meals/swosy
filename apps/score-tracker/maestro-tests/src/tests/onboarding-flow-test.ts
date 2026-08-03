/**
 * onboarding-flow-test.ts – Tests the first-launch onboarding tour: on a fresh
 * profile the tour appears before the app, "Weiter" walks through all steps,
 * the last step's "Los geht's!" closes the tour and lands on the game screen.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { ComponentIds } from '../../../frontend/constants/ComponentIds';

const test = new MaestroTestCase({
	appId: 'com.scoretracker.web',
	tags: ['web', 'onboarding'],
	outputFileName: 'onboarding-flow-test',
});

test
	.openPage('http://localhost:8082/')
	.waitForAnimationToEnd()
	.assertVisibleId(ComponentIds.ONBOARDING_NEXT_BUTTON)
	.takeScreenshot('onboarding-step-welcome')

	// Walk through all four steps via "Weiter" (the last tap is "Los geht's!")
	.tapOnId(ComponentIds.ONBOARDING_NEXT_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('onboarding-step-games')
	.tapOnId(ComponentIds.ONBOARDING_NEXT_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('onboarding-step-friends')
	.tapOnId(ComponentIds.ONBOARDING_NEXT_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('onboarding-step-tools')
	.tapOnId(ComponentIds.ONBOARDING_NEXT_BUTTON)
	.waitForAnimationToEnd()

	// The tour is gone and the setup phase of the game screen is visible
	.assertVisibleId(ComponentIds.GAME_ADD_PLAYER_BUTTON)
	.takeScreenshot('onboarding-finished-game-screen');

export default test;
