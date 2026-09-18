import type { ReactNode } from 'react';

/**
 * The parts of the text recognition (OCR) that web and native have in common.
 *
 * Both platforms run the very same engine — Tesseract, compiled to WebAssembly.
 * The web build loads it into the page; native loads it into a hidden WebView
 * (`useTextRecognition.tsx`). That keeps the feature free of any native module,
 * so it ships as an OTA update and needs no new app binary.
 *
 * The engine and its language data are fetched from a CDN on first use and then
 * cached by the browser. **The photographed card itself never leaves the
 * device** — recognition happens locally, only the engine is downloaded.
 */

/** Pinned on purpose: an OCR engine that changes under us changes what we read. */
export const TESSERACT_VERSION = '7.0.0';

/** Where the engine, its worker, its wasm core and its language data come from. */
export const TESSERACT_BASE_URL = 'https://cdn.jsdelivr.net/';

export const TESSERACT_SCRIPT_URL = `${TESSERACT_BASE_URL}npm/tesseract.js@${TESSERACT_VERSION}/dist/tesseract.min.js`;

/**
 * English is the right model for a bank card even in Germany: the IBAN is
 * digits and Latin letters, and the English model is the one Tesseract ships
 * the most training for.
 */
export const TESSERACT_LANGUAGE = 'eng';

/**
 * Longest edge the image is scaled to before recognition. Large enough that the
 * IBAN line stays legible, small enough to keep one pass near a second and the
 * native bridge payload small.
 */
export const MAX_RECOGNITION_IMAGE_WIDTH = 1600;

/** JPEG quality of the scaled-down frame handed to the engine. */
export const RECOGNITION_IMAGE_COMPRESSION = 0.8;

/** The frame handed to the recognizer, as `takePictureAsync` returns it. */
export interface RecognitionImage {
	uri: string;
	width?: number;
}

/** What a platform's `useTextRecognition` hook gives its caller. */
export interface TextRecognitionApi {
	/** Recognizes the text in an image and returns it line by line. */
	recognizeLines: (image: RecognitionImage) => Promise<string[]>;
	/** 0…1 while the engine loads or reads, `null` when it is idle. */
	progress: number | null;
	/** Set once the engine failed to load or a recognition failed. */
	errorMessage: string | null;
	/** Must be rendered by the caller — on native it carries the engine. */
	engineElement: ReactNode;
}

/** What the WebView page posts back to the app. */
export type TextRecognitionEngineMessage =
	| { type: 'ready'; engineLoaded: boolean }
	| { type: 'progress'; status: string; progress: number }
	| { type: 'result'; id: string; text: string }
	| { type: 'error'; id?: string; message: string };

/** Splits the engine's raw output into the lines the IBAN search works on. */
export const splitRecognizedText = (text: string): string[] =>
	text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

/**
 * The page that runs Tesseract inside the WebView on native.
 *
 * It exposes `window.recognizeImage({ id, image })`, which the app calls through
 * `injectJavaScript`, and reports back through `ReactNativeWebView.postMessage`.
 * Kept to ES5 syntax and free of any bundler: this string is the whole program.
 */
export const buildTextRecognitionPageHtml = (): string => `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
	</head>
	<body>
		<script src="${TESSERACT_SCRIPT_URL}"></script>
		<script>
			(function () {
				var post = function (message) {
					if (window.ReactNativeWebView) {
						window.ReactNativeWebView.postMessage(JSON.stringify(message));
					}
				};

				var workerPromise = null;
				var getWorker = function () {
					if (!window.Tesseract) {
						return Promise.reject(new Error('text recognition engine could not be loaded'));
					}
					if (!workerPromise) {
						workerPromise = window.Tesseract.createWorker('${TESSERACT_LANGUAGE}', 1, {
							logger: function (entry) {
								if (entry && typeof entry.progress === 'number') {
									post({ type: 'progress', status: String(entry.status || ''), progress: entry.progress });
								}
							},
						});
					}
					return workerPromise;
				};

				window.recognizeImage = function (request) {
					getWorker()
						.then(function (worker) {
							return worker.recognize(request.image);
						})
						.then(function (result) {
							post({ type: 'result', id: request.id, text: String((result && result.data && result.data.text) || '') });
						})
						.catch(function (error) {
							// Build a fresh worker next time: a worker that failed to
							// start stays broken for every following frame.
							workerPromise = null;
							post({ type: 'error', id: request.id, message: String((error && error.message) || error) });
						});
				};

				post({ type: 'ready', engineLoaded: Boolean(window.Tesseract) });
			})();
		</script>
	</body>
</html>
`;
