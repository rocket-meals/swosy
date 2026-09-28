import * as fs from 'fs';
import * as path from 'path';
import { ENGINE_DIRECTORY_NAME, ENGINE_FILE_NAMES, ONNXRUNTIME_FILE_NAMES, WEB_EXECUTION_PROVIDERS } from '../helper/TextRecognitionShared';

/**
 * The engine is bundled, and it has to stay bundled.
 *
 * A photo of a bank card should not tell anyone that someone is photographing a
 * bank card. Both libraries involved reach for a CDN when they are not told
 * otherwise, and a lapse here looks like nothing from the outside: the scanner
 * keeps working, it just fetches the engine from somewhere else first. So this
 * tests the two things that would be silently wrong.
 */
const APP_DIRECTORY = path.join(__dirname, '..');
const ENGINE_DIRECTORY = path.join(APP_DIRECTORY, 'public', ENGINE_DIRECTORY_NAME);

/** The files that decide where the engine is loaded from. */
const SOURCE_FILES = ['helper/TextRecognitionShared.ts', 'hooks/useTextRecognition.tsx', 'hooks/useTextRecognition.web.tsx', 'helper/textRecognitionPage/page.ts', 'helper/textRecognitionPage/preparePageFile.ts', 'helper/textRecognitionPage/buildPageHtml.ts'];

/** The page bundle the device's WebView runs, as the build script writes it. */
const PAGE_BUNDLE = path.join(ENGINE_DIRECTORY, 'text-recognition-page.webviewjs');

describe('the bundled text recognition engine', () => {
	it.each(Object.values(ENGINE_FILE_NAMES))('ships the model file %s', (fileName) => {
		expect(fs.existsSync(path.join(ENGINE_DIRECTORY, fileName))).toBe(true);
	});

	it.each(Object.values(ONNXRUNTIME_FILE_NAMES))('ships the runtime file %s for the browser', (fileName) => {
		expect(fs.existsSync(path.join(ENGINE_DIRECTORY, fileName))).toBe(true);
	});

	it.each(SOURCE_FILES)('names no remote address in %s', (relativePath) => {
		const source = fs.readFileSync(path.join(APP_DIRECTORY, relativePath), 'utf-8');
		const lines = source.split('\n').filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('//'));
		expect(lines.join('\n')).not.toMatch(/https?:\/\//);
	});

	it('overwrites the CDN address onnxruntime fills in for itself', () => {
		// The library sets `wasmPaths` to a jsDelivr URL when it is imported, and
		// only fills in that default while the field is empty — so the assignment
		// has to happen, and it has to happen unconditionally.
		const source = fs.readFileSync(path.join(APP_DIRECTORY, 'hooks/useTextRecognition.web.tsx'), 'utf-8');
		expect(source).toMatch(/\.env\.wasm\.wasmPaths\s*=/);
	});

	it('pins the backend, so the runtime cannot ask for a file that is not here', () => {
		// Left alone the engine asks for WebGPU first, and onnxruntime then loads a
		// different, WebGPU-capable WebAssembly file. That file is not bundled, and
		// a browser run showed what happens next: a 404 on
		// `ort-wasm-simd-threaded.jsep.mjs`, and the CDN right behind it.
		expect(WEB_EXECUTION_PROVIDERS).toEqual(['wasm']);
		const source = fs.readFileSync(path.join(APP_DIRECTORY, 'hooks/useTextRecognition.web.tsx'), 'utf-8');
		expect(source).toMatch(/executionProviders/);
	});

	it('hands the engine every model path, leaving none to its own default', () => {
		// `ppu-paddle-ocr` falls back to a Hugging Face URL per model. All three
		// have to be passed, in the browser and on the page a device runs.
		for (const relativePath of ['helper/textRecognitionPage/page.ts', 'hooks/useTextRecognition.web.tsx']) {
			const source = fs.readFileSync(path.join(APP_DIRECTORY, relativePath), 'utf-8');
			expect(source).toMatch(/\bdetection\b/);
			expect(source).toMatch(/\brecognition\b/);
			expect(source).toMatch(/\bcharactersDictionary\b/);
		}
	});

	it('hands the page its WebAssembly as bytes and leaves it no path to load one from', () => {
		// With `wasmBinary` set and `wasmPaths` cleared, onnxruntime uses the
		// loader bundled into the page and never asks for a file. `ppu-paddle-ocr`
		// fills `wasmPaths` with a CDN address on import, so clearing it is not
		// optional.
		const source = fs.readFileSync(path.join(APP_DIRECTORY, 'helper/textRecognitionPage/page.ts'), 'utf-8');
		expect(source).toMatch(/\.env\.wasm\.wasmBinary\s*=/);
		expect(source).toMatch(/\.env\.wasm\.wasmPaths\s*=\s*undefined/);
		expect(source).toMatch(/\.env\.wasm\.numThreads\s*=\s*1/);
	});

	it('reads the engine off the device rather than fetching it, on native', () => {
		// The page is composed from bundled assets and everything it needs is
		// inlined into it; nothing is fetched on the way there or afterwards.
		for (const relativePath of ['hooks/useTextRecognition.tsx', 'helper/textRecognitionPage/preparePageFile.ts']) {
			const source = fs.readFileSync(path.join(APP_DIRECTORY, relativePath), 'utf-8');
			expect(source).not.toMatch(/fetch\(/);
		}
		const preparePage = fs.readFileSync(path.join(APP_DIRECTORY, 'helper/textRecognitionPage/preparePageFile.ts'), 'utf-8');
		expect(preparePage).toMatch(/\.base64\(\)/);
	});

	it('ships the page bundle the device runs, built from page.ts', () => {
		expect(fs.existsSync(PAGE_BUNDLE)).toBe(true);
		const bundle = fs.readFileSync(PAGE_BUNDLE, 'utf-8');
		expect(bundle.startsWith('/* Built by scripts/build-text-recognition-page.mjs')).toBe(true);
		// The page installs itself under this name; the app injects calls to it.
		expect(bundle).toContain('__textRecognitionPage');
		// Inlined into a <script>, so it must not close one.
		expect(bundle).not.toContain('</script');
	});
});
