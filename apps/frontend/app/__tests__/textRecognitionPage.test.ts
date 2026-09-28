import { PAGE_GLOBAL_NAME, buildInitScript, buildRecognizeScript, parsePageMessage } from '../helper/textRecognitionPage/protocol';
import { buildPageHtml } from '../helper/textRecognitionPage/buildPageHtml';
import { RECOGNIZE_TIMEOUT_MS, START_TIMEOUT_MS, TextRecognitionBridge, WebViewHandle } from '../helper/textRecognitionPage/bridge';

/**
 * The seam between the app and the text recognition page: the protocol, the
 * composed document, and the bridge that keeps the two sides' promises.
 * The page itself is checked in a real browser by
 * `scripts/verify-text-recognition-page.mjs`; this is everything around it.
 */
describe('the page protocol', () => {
	it('parses the four messages the page may post and nothing else', () => {
		expect(parsePageMessage(JSON.stringify({ type: 'ready' }))).toEqual({ type: 'ready' });
		expect(parsePageMessage(JSON.stringify({ type: 'result', id: '1', text: 'a\nb', sharpness: 12.5 }))).toEqual({ type: 'result', id: '1', text: 'a\nb', sharpness: 12.5 });
		expect(parsePageMessage(JSON.stringify({ type: 'failed', id: '1', message: 'no' }))).toEqual({ type: 'failed', id: '1', message: 'no' });
		expect(parsePageMessage(JSON.stringify({ type: 'init-failed', message: 'no' }))).toEqual({ type: 'init-failed', message: 'no' });

		expect(parsePageMessage('not json')).toBeNull();
		expect(parsePageMessage('42')).toBeNull();
		expect(parsePageMessage(JSON.stringify({ type: 'something-else' }))).toBeNull();
		expect(parsePageMessage(JSON.stringify({ hello: 'world' }))).toBeNull();
	});

	it('injects a statement that calls the page and evaluates to something serializable', () => {
		const script = buildRecognizeScript({ id: '7', imageBase64: 'AAAA', mimeType: 'image/jpeg' });
		expect(script).toBe(`window.${PAGE_GLOBAL_NAME}.recognize({"id":"7","imageBase64":"AAAA","mimeType":"image/jpeg"}); true;`);
	});

	it('starts the engine with everything base64-encoded inside the call', () => {
		expect(buildInitScript({ wasm: 'W', detection: 'D', recognition: 'R', dictionary: 'C' })).toBe(`window.${PAGE_GLOBAL_NAME}.init({"wasm":"W","detection":"D","recognition":"R","dictionary":"C"});`);
	});
});

describe('the composed page', () => {
	const payload = { wasm: 'V0FTTQ==', detection: 'REVU', recognition: 'UkVD', dictionary: 'RElDVA==' };

	it('is one document with the bundle first and the engine start second', () => {
		const html = buildPageHtml('window.__bundle = true;', payload);
		expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
		expect(html).toContain('<meta charset="utf-8">');
		const bundleAt = html.indexOf('<script>window.__bundle = true;</script>');
		const initAt = html.indexOf(`<script>${buildInitScript(payload)}</script>`);
		expect(bundleAt).toBeGreaterThan(0);
		expect(initAt).toBeGreaterThan(bundleAt);
	});

	it('refers to nothing outside itself', () => {
		const html = buildPageHtml('/* bundle */', payload);
		expect(html).not.toMatch(/\bsrc=/);
		expect(html).not.toMatch(/\bhref=/);
		expect(html).not.toMatch(/https?:\/\//);
	});

	it('refuses a bundle that would end its own script tag early', () => {
		expect(() => buildPageHtml('alert("</script>")', payload)).toThrow(/closing script tag/);
	});
});

describe('the bridge', () => {
	/** A WebView that records what was injected and lets the test answer as the page. */
	const makeHandle = (bridge: TextRecognitionBridge): WebViewHandle & { scripts: string[]; answer: (message: object) => void } => {
		const handle = {
			scripts: [] as string[],
			injectJavaScript: (script: string) => {
				handle.scripts.push(script);
			},
			answer: (message: object) => bridge.onPageMessage(JSON.stringify(message)),
		};
		return handle;
	};

	/** The id the bridge gave the request in a recorded script. */
	const idOf = (script: string): string => JSON.parse(script.slice(script.indexOf('(') + 1, script.lastIndexOf(')'))).id;

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('wants a WebView from the first frame on, and not before', () => {
		const bridge = new TextRecognitionBridge();
		expect(bridge.isWanted).toBe(false);
		const listener = jest.fn();
		bridge.subscribe(listener);

		void bridge.recognize('AAAA', 'image/jpeg').catch(() => undefined);

		expect(bridge.isWanted).toBe(true);
		expect(bridge.getStatus()).toBe('starting');
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('holds frames back until the page is ready, then sends them in order', async () => {
		const bridge = new TextRecognitionBridge();
		const first = bridge.recognize('first', 'image/jpeg');
		const second = bridge.recognize('second', 'image/jpeg');
		const handle = makeHandle(bridge);
		bridge.attach(handle);
		expect(handle.scripts).toEqual([]);

		handle.answer({ type: 'ready' });
		expect(bridge.getStatus()).toBe('ready');
		expect(handle.scripts).toHaveLength(2);
		expect(handle.scripts[0]).toContain('"imageBase64":"first"');
		expect(handle.scripts[1]).toContain('"imageBase64":"second"');

		handle.answer({ type: 'result', id: idOf(handle.scripts[1]!), text: 'B', sharpness: 2 });
		handle.answer({ type: 'result', id: idOf(handle.scripts[0]!), text: 'A', sharpness: null });
		await expect(first).resolves.toEqual({ text: 'A', sharpness: null });
		await expect(second).resolves.toEqual({ text: 'B', sharpness: 2 });
	});

	it('sends a frame straight through once the page is up', () => {
		const bridge = new TextRecognitionBridge();
		void bridge.recognize('warm-up', 'image/jpeg').catch(() => undefined);
		const handle = makeHandle(bridge);
		bridge.attach(handle);
		handle.answer({ type: 'ready' });

		void bridge.recognize('later', 'image/jpeg').catch(() => undefined);
		expect(handle.scripts).toHaveLength(2);
		expect(handle.scripts[1]).toContain('"imageBase64":"later"');
	});

	it('rejects a frame the page could not read, and only that one', async () => {
		const bridge = new TextRecognitionBridge();
		const bad = bridge.recognize('bad', 'image/jpeg');
		const good = bridge.recognize('good', 'image/jpeg');
		const handle = makeHandle(bridge);
		bridge.attach(handle);
		handle.answer({ type: 'ready' });

		handle.answer({ type: 'failed', id: idOf(handle.scripts[0]!), message: 'the frame could not be decoded' });
		await expect(bad).rejects.toThrow('the frame could not be decoded');
		handle.answer({ type: 'result', id: idOf(handle.scripts[1]!), text: 'ok', sharpness: 1 });
		await expect(good).resolves.toEqual({ text: 'ok', sharpness: 1 });
	});

	it('fails everything when the engine cannot start, and tries again on the next frame', async () => {
		const bridge = new TextRecognitionBridge();
		const pending = bridge.recognize('AAAA', 'image/jpeg');
		const handle = makeHandle(bridge);
		bridge.attach(handle);
		handle.answer({ type: 'init-failed', message: 'the text recognition engine could not be started: boom' });

		await expect(pending).rejects.toThrow('could not be started: boom');
		expect(bridge.getStatus()).toBe('failed');
		expect(bridge.isWanted).toBe(false);

		void bridge.recognize('again', 'image/jpeg').catch(() => undefined);
		expect(bridge.getStatus()).toBe('starting');
		expect(bridge.isWanted).toBe(true);
	});

	it('gives up on a page that never comes up', async () => {
		const bridge = new TextRecognitionBridge();
		const pending = bridge.recognize('AAAA', 'image/jpeg');
		jest.advanceTimersByTime(START_TIMEOUT_MS);
		await expect(pending).rejects.toThrow('did not start in time');
		expect(bridge.getStatus()).toBe('failed');
	});

	it('gives up on a frame the page never answers', async () => {
		const bridge = new TextRecognitionBridge();
		const pending = bridge.recognize('AAAA', 'image/jpeg');
		const handle = makeHandle(bridge);
		bridge.attach(handle);
		handle.answer({ type: 'ready' });
		jest.advanceTimersByTime(RECOGNIZE_TIMEOUT_MS);
		await expect(pending).rejects.toThrow('did not answer in time');
	});

	it('settles what is waiting when the WebView goes away', async () => {
		const bridge = new TextRecognitionBridge();
		const pending = bridge.recognize('AAAA', 'image/jpeg');
		const handle = makeHandle(bridge);
		bridge.attach(handle);
		handle.answer({ type: 'ready' });

		bridge.detach();
		await expect(pending).rejects.toThrow('was closed');
		expect(bridge.getStatus()).toBe('idle');
	});

	it('is idle only once nothing has been asked of it for a while', () => {
		const bridge = new TextRecognitionBridge();
		void bridge.recognize('AAAA', 'image/jpeg').catch(() => undefined);
		const handle = makeHandle(bridge);
		bridge.attach(handle);
		handle.answer({ type: 'ready' });

		// A frame is still waiting: not idle, however long it takes.
		jest.advanceTimersByTime(60_000);
		expect(bridge.isIdleFor(30_000)).toBe(false);

		handle.answer({ type: 'result', id: idOf(handle.scripts[0]!), text: '', sharpness: null });
		expect(bridge.isIdleFor(30_000)).toBe(false);
		jest.advanceTimersByTime(30_000);
		expect(bridge.isIdleFor(30_000)).toBe(true);

		bridge.release();
		expect(bridge.isWanted).toBe(false);
	});

	it('ignores whatever else the WebView posts', () => {
		const bridge = new TextRecognitionBridge();
		expect(() => bridge.onPageMessage('{"type":"navigation"}')).not.toThrow();
		expect(() => bridge.onPageMessage('garbage')).not.toThrow();
	});
});
