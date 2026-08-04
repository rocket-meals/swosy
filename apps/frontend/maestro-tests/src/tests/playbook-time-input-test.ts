/**
 * playbook-time-input-test.ts – interaction test for the segmented time input
 * (`SettingsListTimeInput` / `TimeInputFields` in common-ui), driven through
 * its playbook detail screen.
 *
 * Beyond the auto-generated playbook smoke test this exercises the input's
 * actual typing behavior, including a regression check that the keyboard's
 * "Next"/Enter action advances to the following segment (it used to do
 * nothing on non-last segments):
 *
 * 1. Open the modal via the settings row, all fields empty ("00" placeholder).
 * 2. Type "12" into hours – the second digit auto-advances to minutes.
 * 3. Type "3" into minutes, press Enter – the Next action advances to seconds.
 * 4. Type "45" into seconds, press Enter – the Done action saves and closes.
 * 5. The row now shows "12h 03m 45s": every digit landed in its intended
 *    segment, so auto-advance, Next-advance and save all worked.
 *
 * IMPORTANT: Element targeting uses ComponentIds via nativeID (rendered as
 * HTML `id`), see `packages/common-ui/src/constants/ComponentIds.ts`.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { CommonUiComponentIds } from '../../../../../packages/common-ui/src/constants/ComponentIds';

const BASE_URL = 'http://localhost:8081';

const test = new MaestroTestCase({
	appId: 'com.rocketmeals.web',
	tags: ['web', 'playbook'],
	outputFileName: 'playbook-time-input-interaction',
});

test
	// value=0 keeps all segment fields empty (placeholder-only) at the start.
	.openPage(`${BASE_URL}/experimentell/playbook/SettingsListTimeInput?kioskMode=true&value=0`)
	.waitForAnimationToEnd()
	.assertVisibleId(CommonUiComponentIds.PLAYBOOK_TARGET)

	// Open the time input modal via the settings row.
	.tapOnId(CommonUiComponentIds.TIME_INPUT_ROW)
	.waitForAnimationToEnd()
	.assertVisibleId(CommonUiComponentIds.TIME_INPUT_FIELD_PREFIX + 'hours')
	.takeScreenshot('playbook-time-input-modal-empty')

	// Hours: the second typed digit auto-advances the focus to minutes.
	.tapOnId(CommonUiComponentIds.TIME_INPUT_FIELD_PREFIX + 'hours')
	.inputText('12')
	// Minutes: one digit, then the keyboard's Next/Enter action advances to seconds.
	.inputText('3')
	.pressKey('Enter')
	// Seconds: two digits, then Done/Enter saves and closes the modal.
	.inputText('45')
	.takeScreenshot('playbook-time-input-modal-filled')
	.pressKey('Enter')
	.waitForAnimationToEnd()

	// The row's formatted value proves every digit landed in its segment.
	.assertVisible('12h 03m 45s')
	.takeScreenshot('playbook-time-input-saved');

export default test;
