/**
 * Runs the built text recognition page in a real Chromium, offline, against
 * the fourteen photographed bank cards in `packages/common`.
 *
 *     yarn workspace rocket-meals-dev verify:text-recognition-page
 *
 * This is the check a device cannot give us from here: the page is loaded
 * from a `file://` URL the way a WebView loads it, every network request is
 * refused, and each card is pushed through the same `recognize` call the app
 * injects. The run fails when the engine does not come up, when anything
 * tries to reach the network, or when a card yields an IBAN that is not
 * printed on it. The lines it reads are compared with the recording in
 * `bank-cards.paddleocr.json` and any difference is printed, not failed:
 * the recording was made in Node, and the arithmetic of two onnxruntime
 * builds is allowed to differ in the last digit.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(appDirectory, '..', '..', '..');
const engineDirectory = path.join(appDirectory, 'public', 'paddleocr');
const fixtureDirectory = path.join(repositoryRoot, 'packages', 'common', 'src', '__tests__', 'fixtures', 'bankcards');

/**
 * The TypeScript this script shares with the app, bundled in memory so the
 * page is composed here exactly as the app composes it.
 */
const loadShared = async () => {
	const entry = [
		`export { buildPageHtml } from ${JSON.stringify(path.join(appDirectory, 'helper', 'textRecognitionPage', 'buildPageHtml.ts'))};`,
		`export { buildRecognizeScript } from ${JSON.stringify(path.join(appDirectory, 'helper', 'textRecognitionPage', 'protocol.ts'))};`,
		`export { splitRecognizedText } from ${JSON.stringify(path.join(appDirectory, 'helper', 'TextRecognitionShared.ts'))};`,
		`export { IbanRecognitionHelper } from ${JSON.stringify(path.join(repositoryRoot, 'packages', 'common', 'src', 'form', 'IbanRecognitionHelper.ts'))};`,
	].join('\n');
	const result = await build({
		stdin: { contents: entry, resolveDir: appDirectory, loader: 'ts' },
		bundle: true,
		write: false,
		format: 'esm',
		platform: 'node',
		target: 'node20',
	});
	const code = result.outputFiles[0].text;
	return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
};

const readBase64 = (fileName) => fs.readFileSync(path.join(engineDirectory, fileName)).toString('base64');

const main = async () => {
	const { buildPageHtml, buildRecognizeScript, splitRecognizedText, IbanRecognitionHelper } = await loadShared();

	const html = buildPageHtml(fs.readFileSync(path.join(engineDirectory, 'text-recognition-page.webviewjs'), 'utf-8'), {
		wasm: readBase64('ort-wasm-simd-threaded.wasm'),
		detection: readBase64('PP-OCRv6_tiny_det.ort'),
		recognition: readBase64('PP-OCRv6_tiny_rec.ort'),
		dictionary: readBase64('ppocrv6_tiny_dict.txt'),
	});
	const pageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'text-recognition-page-'));
	const pageFile = path.join(pageDirectory, 'page.html');
	fs.writeFileSync(pageFile, html);
	console.log(`page: ${(html.length / 1024 / 1024).toFixed(1)} MB at ${pageFile}`);

	const executablePath = process.env.TEXT_RECOGNITION_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
	const browser = await chromium.launch({ executablePath, args: ['--no-sandbox', '--disable-gpu'] });
	const page = await browser.newPage();

	const networkRequests = [];
	await page.route('**/*', (route) => {
		const url = route.request().url();
		if (url.startsWith('file://') || url.startsWith('data:') || url.startsWith('blob:')) {
			route.continue();
			return;
		}
		networkRequests.push(url);
		route.abort();
	});
	page.on('console', (message) => {
		if (message.type() === 'error' || message.type() === 'warning') {
			console.log(`  [page ${message.type()}] ${message.text()}`);
		}
	});
	page.on('pageerror', (error) => console.log(`  [page error] ${error.message}`));

	/** Messages the page posts, resolved by whoever is waiting for them. */
	const waiting = new Map();
	let readyResolve;
	let readyReject;
	const ready = new Promise((resolve, reject) => {
		readyResolve = resolve;
		readyReject = reject;
	});
	await page.exposeFunction('__textRecognitionSink', (serialized) => {
		const message = JSON.parse(serialized);
		if (message.type === 'ready') {
			readyResolve();
		} else if (message.type === 'init-failed') {
			readyReject(new Error(message.message));
		} else {
			waiting.get(message.id)?.(message);
			waiting.delete(message.id);
		}
	});
	// Stand in for react-native-webview's bridge.
	await page.addInitScript(() => {
		window.ReactNativeWebView = { postMessage: (message) => window.__textRecognitionSink(message) };
	});

	const startedAt = Date.now();
	await page.goto(pathToFileURL(pageFile).href);
	await Promise.race([ready, new Promise((_, reject) => setTimeout(() => reject(new Error('the engine did not report ready within 120 s')), 120_000))]);
	console.log(`engine ready after ${Date.now() - startedAt} ms`);

	const recorded = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, 'bank-cards.paddleocr.json'), 'utf-8')).cards;
	const outcomes = { read: 0, nothing: 0, wrong: 0 };
	let differing = 0;
	for (const card of recorded) {
		const imageBase64 = fs.readFileSync(path.join(fixtureDirectory, card.file)).toString('base64');
		const id = card.file;
		const answer = new Promise((resolve) => waiting.set(id, resolve));
		const readingStartedAt = Date.now();
		await page.evaluate(buildRecognizeScript({ id, imageBase64, mimeType: 'image/png' }));
		const message = await Promise.race([answer, new Promise((_, reject) => setTimeout(() => reject(new Error(`no answer for ${id} within 60 s`)), 60_000))]);
		const milliseconds = Date.now() - readingStartedAt;
		if (message.type !== 'result') {
			throw new Error(`${id}: ${message.message}`);
		}
		const lines = splitRecognizedText(message.text);
		const found = IbanRecognitionHelper.findIban(lines, { allowInvalidChecksum: true })?.iban ?? null;
		let outcome;
		if (found === card.printedIban) {
			outcome = card.printedIban === null ? 'nothing' : 'read';
		} else {
			outcome = found === null ? 'nothing' : 'wrong';
		}
		outcomes[outcome]++;
		const sameAsRecorded = JSON.stringify(lines) === JSON.stringify(card.recognizedLines);
		if (!sameAsRecorded) {
			differing++;
		}
		console.log(`${outcome.padEnd(7)} ${String(milliseconds).padStart(5)} ms  ${card.file}${sameAsRecorded ? '' : '  (lines differ from the Node recording)'}`);
		if (!sameAsRecorded) {
			console.log(`         recorded: ${JSON.stringify(card.recognizedLines)}`);
			console.log(`         read:     ${JSON.stringify(lines)}`);
		}
	}

	await browser.close();
	fs.rmSync(pageDirectory, { recursive: true, force: true });

	console.log(`\noutcomes: ${JSON.stringify(outcomes)} (recorded in Node: {"read":9,"nothing":5,"wrong":0}); ${differing} card(s) read differently than recorded`);
	if (networkRequests.length > 0) {
		console.error(`the page tried to reach the network:\n  ${networkRequests.join('\n  ')}`);
		process.exit(1);
	}
	if (outcomes.wrong > 0) {
		console.error('a card yielded an IBAN that is not printed on it');
		process.exit(1);
	}
	console.log('no network request, no wrong IBAN');
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
