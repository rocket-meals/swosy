/**
 * speiseplan-print-euro-test.ts – Regression test for a customer-reported bug:
 * printing the "Speiseplan" (meal plan) week view corrupted the € sign into
 * mojibake (e.g. "â‚¬") in the print-preview window, while the on-screen page
 * rendered it correctly. Root cause: the print HTML built by `handlePrint()`
 * (apps/frontend/app/app/(monitor)/list-week-screen/details/index.tsx) was
 * opened via a Blob URL without any `<meta charset="utf-8">` / charset-tagged
 * MIME type, so the browser had to guess the document's encoding.
 *
 * Flow: open the monitor "Food Plan: Week" settings → pick a canteen → open the
 * week grid → open the current week's details → assert the € sign renders
 * on-screen → tap the print icon → assert the € sign still renders correctly
 * (and not as mojibake) in the print-preview document that opens in a new tab.
 *
 * NOTE: Maestro's web driver automatically switches its active window to a
 * newly opened browser tab/window (e.g. from `window.open()`), so the
 * assertions after tapping the print icon run against the print-preview
 * document without any extra steps.
 *
 * IMPORTANT: Always use ComponentIds (from app/constants/ComponentIds.ts) with
 * nativeID for element targeting so Maestro web tests can locate elements by
 * their id attribute.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { ComponentIds } from '../../../app/constants/ComponentIds';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'print', 'regression'],
	outputFileName: 'speiseplan-print-euro-test',
});

test
	.openPage('http://localhost:8081/foodPlanWeek')
	.waitForAnimationToEnd()

	// Pick the first available canteen for the week monitor view
	.tapOnId(ComponentIds.MONITOR_FOODPLAN_WEEK_CANTEEN_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.CANTEEN_SELECT_BUTTON)
	.waitForAnimationToEnd()

	// Continue to the week grid, then open the current week's details (Speiseplan)
	.tapOnId(ComponentIds.MONITOR_FOODPLAN_WEEK_BIGSCREEN_BUTTON)
	.waitForAnimationToEnd()
	.tapOnId(ComponentIds.MONITOR_LIST_WEEK_CURRENT_WEEK_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('speiseplan-week-onscreen')

	// Sanity check: the on-screen meal plan renders prices with a correct € sign
	.assertVisible('€')

	// Regression check: printing must not corrupt the € sign into mojibake
	.tapOnId(ComponentIds.MONITOR_LIST_WEEK_PRINT_BUTTON)
	.waitForAnimationToEnd()
	.takeScreenshot('speiseplan-print-preview')
	.assertVisible('€')
	.assertNotVisible('â‚¬');

export default test;
