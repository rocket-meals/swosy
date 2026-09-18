import * as fs from 'fs';
import * as path from 'path';

import { ENGINE_FILE_NAMES } from '../helper/TextRecognitionShared';

/**
 * The text recognition reads a photographed bank card. Neither that photo nor
 * the request for the engine may reach a third party, so the engine ships with
 * the app and every path to it is local.
 *
 * This is easy to undo by accident: leave one of Tesseract's paths unset and
 * the library quietly falls back to its CDN defaults, and nothing about the
 * feature looks broken afterwards. Hence these tests.
 */
const APP_ROOT = path.join(__dirname, '..');

const ENGINE_SOURCE_FILES = ['helper/TextRecognitionShared.ts', 'hooks/useTextRecognition.tsx', 'hooks/useTextRecognition.web.tsx', 'components/GiroCardIbanScanner/index.tsx'];

/** A URL in code, ignoring the ones inside comments. */
const findRemoteUrls = (source: string): string[] =>
	source
		.split('\n')
		.filter((line) => {
			const trimmed = line.trim();
			const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
			return !isComment && /https?:\/\//.test(line);
		})
		.map((line) => line.trim());

describe('text recognition stays offline', () => {
	it.each(ENGINE_SOURCE_FILES)('has no remote URL in %s', (relativePath) => {
		const source = fs.readFileSync(path.join(APP_ROOT, relativePath), 'utf-8');
		expect(findRemoteUrls(source)).toEqual([]);
	});

	it('ships every engine file the library would otherwise fetch', () => {
		for (const fileName of Object.values(ENGINE_FILE_NAMES)) {
			const bundled = path.join(APP_ROOT, 'public', 'tesseract', fileName);
			expect({ fileName, exists: fs.existsSync(bundled) }).toEqual({ fileName, exists: true });
		}
	});

	it('keeps a copy of the engine scripts that Metro bundles as assets', () => {
		// Metro treats a .js file as source code, so native cannot require the
		// engine's own scripts directly - see public/tesseract/README.md.
		for (const fileName of [ENGINE_FILE_NAMES.library, ENGINE_FILE_NAMES.worker, ENGINE_FILE_NAMES.core]) {
			const nativeCopy = path.join(APP_ROOT, 'assets', 'tesseract', `${fileName}.txt`);
			expect({ fileName, exists: fs.existsSync(nativeCopy) }).toEqual({ fileName, exists: true });

			const served = fs.readFileSync(path.join(APP_ROOT, 'public', 'tesseract', fileName), 'utf-8');
			expect(fs.readFileSync(nativeCopy, 'utf-8')).toBe(served);
		}
	});

	it('spells out every path the library needs, so none of them defaults to a CDN', () => {
		const shared = fs.readFileSync(path.join(APP_ROOT, 'helper/TextRecognitionShared.ts'), 'utf-8');
		expect(shared).toContain('workerPath');
		expect(shared).toContain('corePath');
		expect(shared).toContain('langPath');
		// Without this the worker is built from a blob, which has no address for
		// the core loader to resolve its .wasm neighbour against.
		expect(shared).toContain('workerBlobURL: false');
	});
});
