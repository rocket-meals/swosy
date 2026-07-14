/**
 * generate.ts – thin entry point wiring the shared `repo-depkit-maestro-framework`
 * generator to this app's `src/tests` and `generated` folders.
 *
 * Usage (from `apps/score-tracker/frontend/`):
 *   yarn maestro:generate
 */

import * as path from 'path';
import { generateMaestroTests } from 'repo-depkit-maestro-framework';

generateMaestroTests(
	path.join(__dirname, 'src', 'tests'),
	path.join(__dirname, 'generated'),
).catch((err) => {
	console.error(err);
	process.exit(1);
});
