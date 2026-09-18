import type { ReactNode } from 'react';

/**
 * The parts of the text recognition (OCR) that web and native have in common.
 *
 * Both platforms run the same engine — Tesseract, compiled to WebAssembly. The
 * web build serves it from the app's own origin; native copies it onto the
 * device and points a hidden WebView at it (`useTextRecognition.tsx`). Two
 * things follow from that, and both are on purpose:
 *
 * - **Nothing is fetched from a CDN.** The engine ships with the app (see
 *   `public/tesseract/README.md`) and works offline. A photographed bank card
 *   is not something to hand a third party, and neither is the fact that
 *   someone is about to scan one.
 * - **No native module.** React Native has no WebAssembly, a WebView has it, so
 *   the feature needs no new binary and ships as an OTA update.
 */

/** The vendored engine version — see `public/tesseract/README.md`. */
export const TESSERACT_VERSION = '7.0.0';

/**
 * English is the right model for a bank card even in Germany: the IBAN is
 * digits and Latin letters, and English is what Tesseract is trained best on.
 */
export const TESSERACT_LANGUAGE = 'eng';

/** The engine's files, as they are named inside the engine directory. */
export const ENGINE_FILE_NAMES = {
	library: 'tesseract.min.js',
	worker: 'worker.min.js',
	core: 'tesseract-core-simd-lstm.js',
	coreWasm: 'tesseract-core-simd-lstm.wasm',
	trainedData: `${TESSERACT_LANGUAGE}.traineddata.gz`,
} as const;

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
 * The options both platforms hand `Tesseract.createWorker`, given the directory
 * the engine files sit in.
 *
 * Every path is spelled out rather than left to the library, because its
 * defaults point at a CDN. `workerBlobURL: false` matters for the same reason
 * it is easy to get wrong: with the default the worker is built from a blob,
 * and a blob has no address for the core loader to resolve its `.wasm`
 * neighbour against — the worker then dies with "Failed to parse URL". Loading
 * the worker straight out of the directory gives it a base to resolve against.
 */
export const buildWorkerOptions = (engineDirectoryUrl: string) => ({
	workerPath: `${engineDirectoryUrl}/${ENGINE_FILE_NAMES.worker}`,
	corePath: `${engineDirectoryUrl}/${ENGINE_FILE_NAMES.core}`,
	langPath: engineDirectoryUrl,
	workerBlobURL: false,
	gzip: true,
});

/**
 * The page that runs the engine inside the WebView on native.
 *
 * It is written into the engine directory on the device, next to the engine
 * files, so that every path in it is a plain neighbour. It exposes
 * `window.recognizeImage({ id, image })`, which the app calls through
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
		<script src="./${ENGINE_FILE_NAMES.library}"></script>
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
						var options = ${JSON.stringify(buildWorkerOptions('.'))};
						options.logger = function (entry) {
							if (entry && typeof entry.progress === 'number') {
								post({ type: 'progress', status: String(entry.status || ''), progress: entry.progress });
							}
						};
						workerPromise = window.Tesseract.createWorker('${TESSERACT_LANGUAGE}', 1, options);
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
