/**
 * generateMaestroTests – discovers all `MaestroTestCase` files in `testsDir`
 * and writes one Maestro YAML per test into `generatedDir`.
 *
 * Each consuming app calls this from its own thin `generate.ts` entry point
 * with its own `src/tests` and `generated` paths, e.g.:
 *
 * ```ts
 * import * as path from 'path';
 * import { generateMaestroTests } from 'repo-depkit-maestro-framework';
 *
 * generateMaestroTests(
 *   path.join(__dirname, 'src', 'tests'),
 *   path.join(__dirname, 'generated'),
 * ).catch((err) => {
 *   console.error(err);
 *   process.exit(1);
 * });
 * ```
 *
 * The generated YAML files are gitignored; only `generated/.keep` is tracked.
 */

import * as fs from 'fs';
import * as path from 'path';

import { MaestroTestCase } from './MaestroTestCase';

export async function generateMaestroTests(testsDir: string, generatedDir: string): Promise<void> {
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
