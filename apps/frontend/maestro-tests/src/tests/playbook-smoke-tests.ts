/**
 * playbook-smoke-tests.ts – auto-generated smoke tests for the component
 * playbook (`/experimentell/playbook`).
 *
 * One Maestro test per entry in the playbook registry
 * (`packages/common-ui/src/playbook/registryData.ts`): open the component's
 * playbook detail screen directly via URL (kiosk mode performs the demo login
 * so no login flow is needed), assert the component under test renders, take a
 * screenshot, and – when the entry has a boolean knob – toggle it and verify
 * the screen still renders.
 *
 * Adding a component to the playbook registry automatically adds its smoke
 * test here; no per-component test code is required.
 *
 * IMPORTANT: Element targeting uses ComponentIds via nativeID (rendered as
 * HTML `id`), see `app/constants/ComponentIds.ts`.
 */

import { MaestroTestCase } from 'repo-depkit-maestro-framework';
import { ComponentIds } from '../../../app/constants/ComponentIds';
import { playbookRegistryData } from '../../../../../packages/common-ui/src/playbook/registryData';

const BASE_URL = 'http://localhost:8081';

const tests: MaestroTestCase[] = playbookRegistryData.map((entry) => {
	const test = new MaestroTestCase({
		appId: 'com.rocketmeals.web',
		tags: ['web', 'playbook'],
		outputFileName: `playbook-${entry.name}`,
	});

	test
		// Kiosk mode performs the demo login, so the playbook screen inside the
		// authenticated (app) group is reachable directly via URL.
		.openPage(`${BASE_URL}/experimentell/playbook/${entry.name}?kioskMode=true`)
		.waitForAnimationToEnd()
		.assertVisibleId(ComponentIds.PLAYBOOK_TARGET)
		.takeScreenshot(`playbook-${entry.name}`);

	// Toggle the first boolean knob (if any) to verify the knob panel is wired
	// up: the tap updates the URL parameter and re-renders the component.
	const firstBooleanKnob = Object.entries(entry.knobs).find(([, knob]) => knob.type === 'boolean')?.[0];
	if (firstBooleanKnob !== undefined) {
		test
			.tapOnId(ComponentIds.PLAYBOOK_KNOB_PREFIX + firstBooleanKnob)
			.waitForAnimationToEnd()
			.assertVisibleId(ComponentIds.PLAYBOOK_TARGET)
			.takeScreenshot(`playbook-${entry.name}-${firstBooleanKnob}-toggled`);
	}

	return test;
});

export default tests;
