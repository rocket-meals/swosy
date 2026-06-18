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
import translations from '../../../app/locales/translations.json';

/** Return the German translation for the given TranslationKeys value. */
function t(key: TranslationKeys, lang: string = 'de'): string {
	const value = (translations[key as keyof typeof translations] as Record<string, string>)?.[lang];
	if (!value) {
		console.warn(
			`Warning: No translation found for key "${key}" in language "${lang}". ` +
				`The raw key will be used, which will likely cause test failures.`,
		);
	}
	return value ?? String(key);
}

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
	.waitForAnimationToEnd()
	.takeScreenshot('canteen-selection')

	// Step 5: Tap on the first available canteen
	.tapOn(t(TranslationKeys.canteen))

	// Step 6: Wait for the food offers screen to load
	.waitForAnimationToEnd()
	.takeScreenshot('food-offers')

	// Step 7: Verify the food offers page loaded with content
	.assertVisible(t(TranslationKeys.today));

export default test;
