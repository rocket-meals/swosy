/**
 * The text recognition page: PaddleOCR on onnxruntime's WebAssembly build,
 * inside the WebView a device runs it in.
 *
 * This is browser code, not React Native code. `scripts/build-text-recognition-page.mjs`
 * bundles it — together with `ppu-paddle-ocr/web`, `onnxruntime-web` and the
 * shared helpers — into `public/paddleocr/text-recognition-page.webviewjs`,
 * and the app composes that bundle, the WebAssembly and the models into one
 * HTML file at first use (see `preparePageFile.ts`).
 *
 * Why a WebView at all: the native onnxruntime binding crashed the app on
 * Android before a single frame was read, and the web build of the engine had
 * been reading the same models in the browser all along. Running that same
 * build on every platform means one engine, one model, one code path — and a
 * failure that arrives as a message instead of a crash.
 *
 * Nothing here touches the network. The WebAssembly comes in as bytes
 * (`wasmBinary`), the models come in as bytes, and the page has no URL to
 * fetch anything from even if it wanted to.
 */
import * as ort from 'onnxruntime-web';
import { PaddleOcrService } from 'ppu-paddle-ocr/web';

import { MAX_RECOGNITION_IMAGE_WIDTH, SHARPNESS_MEASUREMENT_WIDTH, WEB_EXECUTION_PROVIDERS, measureImageSharpness } from '../TextRecognitionShared';
import { PAGE_GLOBAL_NAME, PageEnginePayload, PageToAppMessage, RecognizeRequest } from './protocol';

/** How the page talks back: react-native-webview's bridge, when it is there. */
interface ReactNativeWebViewBridge {
	postMessage: (message: string) => void;
}

declare global {
	interface Window {
		ReactNativeWebView?: ReactNativeWebViewBridge;
		/** A test harness can take the messages instead of a WebView. */
		__textRecognitionMessageSink?: (message: PageToAppMessage) => void;
	}
}

const describeError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const post = (message: PageToAppMessage): void => {
	const serialized = JSON.stringify(message);
	if (window.ReactNativeWebView) {
		window.ReactNativeWebView.postMessage(serialized);
		return;
	}
	window.__textRecognitionMessageSink?.(message);
};

/**
 * Base64 to bytes, the fast way: the browser's own decoder, via a data URL.
 * The character-by-character fallback covers a WebView that refuses to fetch
 * data URLs — slower, but it gets there.
 */
const decodeBase64 = async (base64: string, mimeType = 'application/octet-stream'): Promise<ArrayBuffer> => {
	try {
		const response = await fetch(`data:${mimeType};base64,${base64}`);
		if (response.ok) {
			return await response.arrayBuffer();
		}
	} catch {
		// Fall through to the manual decoder.
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes.buffer;
};

/** Draws an image onto a canvas of the given width and hands back the canvas. */
const drawToCanvas = (image: HTMLImageElement, width: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } => {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = Math.max(1, Math.round((image.height / image.width) * width));
	const context = canvas.getContext('2d', { willReadFrequently: true });
	if (!context) {
		throw new Error('the page could not create a drawing context');
	}
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	return { canvas, context };
};

const loadImage = (request: RecognizeRequest): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('the frame could not be decoded'));
		image.src = `data:${request.mimeType};base64,${request.imageBase64}`;
	});

let servicePromise: Promise<PaddleOcrService> | null = null;

/**
 * Starts the engine from the bytes the composed page passes in. Called exactly
 * once, by the inline script the app writes below the bundle.
 */
const init = (payload: PageEnginePayload): void => {
	if (servicePromise !== null) {
		return;
	}
	servicePromise = (async () => {
		const [wasm, detection, recognition, charactersDictionary] = await Promise.all([decodeBase64(payload.wasm, 'application/wasm'), decodeBase64(payload.detection), decodeBase64(payload.recognition), decodeBase64(payload.dictionary, 'text/plain')]);

		// One thread, no proxy worker, and no path to load anything from: with
		// the bytes handed over directly, onnxruntime uses the WebAssembly
		// factory bundled into it and never asks for a file. `ppu-paddle-ocr`
		// fills `wasmPaths` with a CDN address when it is imported, so it is
		// cleared here, after that import, on purpose.
		ort.env.wasm.numThreads = 1;
		ort.env.wasm.proxy = false;
		ort.env.wasm.wasmPaths = undefined;
		ort.env.wasm.wasmBinary = wasm;

		const service = new PaddleOcrService({
			model: { detection, recognition, charactersDictionary },
			session: { executionProviders: [...WEB_EXECUTION_PROVIDERS] },
		});
		await service.initialize();
		return service;
	})();
	servicePromise
		.then(() => post({ type: 'ready' }))
		.catch((error: unknown) => {
			post({ type: 'init-failed', message: `the text recognition engine could not be started: ${describeError(error)}` });
		});
};

/** Frames are read one after the other; the engine is not reentrant. */
let queue: Promise<void> = Promise.resolve();

const recognizeNow = async (request: RecognizeRequest): Promise<void> => {
	if (servicePromise === null) {
		post({ type: 'failed', id: request.id, message: 'the text recognition engine was not started' });
		return;
	}
	try {
		const service = await servicePromise;
		const image = await loadImage(request);

		const measured = drawToCanvas(image, Math.min(SHARPNESS_MEASUREMENT_WIDTH, image.width) || 1);
		const sharpness = measureImageSharpness(measured.context.getImageData(0, 0, measured.canvas.width, measured.canvas.height).data, measured.canvas.width, measured.canvas.height);

		const forEngine = drawToCanvas(image, Math.min(MAX_RECOGNITION_IMAGE_WIDTH, image.width) || 1);
		// Grouped by line, not flattened: `text` then separates the lines the
		// engine found with newlines, which is what the IBAN search works on.
		const result = await service.recognize(forEngine.canvas);
		post({ type: 'result', id: request.id, text: result.text ?? '', sharpness });
	} catch (error) {
		post({ type: 'failed', id: request.id, message: describeError(error) });
	}
};

const recognize = (request: RecognizeRequest): void => {
	queue = queue.then(() => recognizeNow(request));
};

(window as unknown as Record<string, unknown>)[PAGE_GLOBAL_NAME] = { init, recognize };
