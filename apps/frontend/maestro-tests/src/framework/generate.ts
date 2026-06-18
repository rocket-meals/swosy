/**
 * generate.ts – discovers all `MaestroTestCase` files in `src/tests/` and
 * writes one Maestro YAML per test into `generated/`.
 *
 * Usage (from `apps/frontend/app/`):
 *   yarn maestro:generate
 *
 * The generated YAML files are gitignored; only `generated/.keep` is tracked.
 */

import * as fs from 'fs';
import * as path from 'path';

import { MaestroTestCase } from './MaestroTestCase';

const testsDir = path.join(__dirname, '..', 'tests');
const generatedDir = path.join(__dirname, '..', '..', 'generated');

async function generate(): Promise<void> {
	fs.mkdirSync(generatedDir, { recursive: true });

	const testFiles = fs
		.readdirSync(testsDir)
		.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));

	if (testFiles.length === 0) {
		console.log('No test files found in', testsDir);
		return;
	}

	for (const testFile of testFiles) {
		const modulePath = path.join(testsDir, testFile);
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const testModule = require(modulePath) as { default?: unknown };
		const testCase = testModule.default;

		if (!(testCase instanceof MaestroTestCase)) {
			console.warn(
				`Skipping ${testFile}: default export is not a MaestroTestCase instance.`,
			);
			continue;
		}

		const outputName = `${testCase.outputFileName}.yaml`;
		const outputPath = path.join(generatedDir, outputName);
		fs.writeFileSync(outputPath, testCase.toYaml(), 'utf-8');
		console.log(`Generated: ${outputPath}`);
	}
}

generate().catch((err) => {
	console.error(err);
	process.exit(1);
});
