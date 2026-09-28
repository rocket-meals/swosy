/**
 * Bundles the text recognition page (`helper/textRecognitionPage/page.ts`)
 * into `public/paddleocr/text-recognition-page.webviewjs`.
 *
 *     yarn workspace rocket-meals-dev build:text-recognition-page
 *
 * The result is committed, like the models and the WebAssembly beside it: the
 * app requires it as an asset and composes it into the WebView page at first
 * use, so no build step of the app depends on this one. Run it again after
 * changing `page.ts`, `protocol.ts`, `TextRecognitionShared.ts`, or after
 * updating `ppu-paddle-ocr` or `onnxruntime-web`.
 *
 * `onnxruntime-web` is aliased to its `wasm.bundle` build: the one that carries
 * the WebAssembly loader inside itself, so that with the binary handed over as
 * bytes nothing is left to fetch. The `.webviewjs` extension keeps Metro from
 * treating the file as source — it is an asset (see `metro.config.js`).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// `onnxruntime-web/wasm` is the package's own name for `dist/ort.wasm.bundle.min.mjs`
// when imported as a module (its `exports` map allows nothing else through).
const onnxruntimeBundle = 'onnxruntime-web/wasm';
const outfile = path.join(appDirectory, 'public', 'paddleocr', 'text-recognition-page.webviewjs');

const result = await build({
	entryPoints: [path.join(appDirectory, 'helper', 'textRecognitionPage', 'page.ts')],
	outfile,
	bundle: true,
	minify: true,
	format: 'iife',
	platform: 'browser',
	// Chrome's WebView and WebKit on iOS 15: both understand ES2020.
	target: ['es2020', 'safari15'],
	alias: { 'onnxruntime-web': onnxruntimeBundle },
	define: { 'process.env.NODE_ENV': '"production"' },
	legalComments: 'none',
	// The runtime keeps an `import(url)` for a proxy worker this page never
	// enables, and `import.meta.url` for locating files this page never loads.
	// Both are left in place and never reached.
	logOverride: { 'unsupported-dynamic-import': 'silent', 'empty-import-meta': 'silent' },
	banner: {
		js: '/* Built by scripts/build-text-recognition-page.mjs from helper/textRecognitionPage/page.ts. Do not edit. */',
	},
	metafile: true,
});

const sizeInKb = Math.round(Object.values(result.metafile.outputs)[0].bytes / 1024);
console.log(`wrote ${path.relative(appDirectory, outfile)} (${sizeInKb} kB)`);
