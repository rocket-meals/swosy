/**
 * web-smoke-test.ts – Web smoke test for the Rocket Meals frontend.
 *
 * This test is the TypeScript equivalent of the original
 * `apps/frontend/.maestro/web-smoke-test.yaml`.  Strings are sourced directly
 * from the app's translation files so they never diverge.
 *
 * Run `yarn maestro:generate` (from `apps/frontend/app/`) to compile this file
 * into `maestro-tests/generated/web-smoke-test.yaml`, then `yarn maestro` to
 * execute the generated YAML with the Maestro CLI.
 */

import { MaestroTestCase } from '../framework/MaestroTestCase';
import translations from '../../../app/locales/translations.json';

type TranslationKey = keyof typeof translations;

/** Return the translation string for `key` in the given language (default: German). */
function t(key: TranslationKey, lang: string = 'de'): string {
	const value = (translations[key] as Record<string, string>)[lang];
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
	.tapOn(t('i_accept_privacy_policy_and_terms_of_service'))

	// Step 2: Tap "Continue without account" for anonymous login
	.tapOn(t('continue_without_account'))

	// Step 3: Confirm the attention sheet about anonymous account limitations
	.waitForAnimationToEnd()
	.assertVisible(t('attention'))
	.tapOn(t('confirm'))

	// Step 4: Wait for the canteen selection screen to load
	.waitForAnimationToEnd()
	.takeScreenshot('canteen-selection')

	// Step 5: Tap on the first available canteen
	.tapOn(t('canteen'))

	// Step 6: Wait for the food offers screen to load
	.waitForAnimationToEnd()
	.takeScreenshot('food-offers')

	// Step 7: Verify the food offers page loaded with content
	.assertVisible(t('today'));

export default test;
