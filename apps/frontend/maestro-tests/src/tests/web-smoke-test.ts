/**
 * web-smoke-test.ts – Web smoke test for the Rocket Meals frontend.
 *
 * Strings are sourced from the app's TranslationKeys enum so they stay in sync
 * with the codebase.  Run `yarn maestro:generate` (from `apps/frontend/app/`)
 * to produce `maestro-tests/generated/web-smoke-test.yaml`, then `yarn maestro`
 * (or `./run-maestro-web-test.sh`) to execute it with the Maestro CLI.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import { TranslationKeys } from '../../../app/locales/keys';
import { t } from '../framework/loginHelper';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'smoke'],
	outputFileName: 'web-smoke-test',
});

test
	// Open the app
	.openPage('http://localhost:8081/rocket-meals/')
	.waitForAnimationToEnd()
	.takeScreenshot('app-loaded')

	// Step 1: Accept the privacy policy (required to enable the login buttons)
	.tapOn(t(TranslationKeys.i_accept_privacy_policy_and_terms_of_service))

	// Step 2: Tap "Continue without account" for anonymous login
	.tapOn(t(TranslationKeys.continue_without_account))

	// Step 3: Confirm the attention sheet about anonymous account limitations
	.waitForAnimationToEnd()
	.assertVisible(t(TranslationKeys.attention))
	.tapOn(t(TranslationKeys.confirm))

	// Step 4: Wait for the canteen selection screen to load
	// The default web export connects to the test backend, so canteens should load.
	.waitForAnimationToEnd()
	.takeScreenshot('canteen-selection')
	.assertVisible(t(TranslationKeys.please_select_your_canteen))
	.assertNotVisible(t(TranslationKeys.no_canteens_found))
	.takeScreenshot('smoke-test-complete');

export default test;
