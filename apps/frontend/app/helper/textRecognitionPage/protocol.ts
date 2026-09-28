/**
 * What the app and the text recognition page say to each other.
 *
 * On a device the engine runs inside a WebView (see `page.ts`), and the two
 * sides only ever exchange JSON strings: the app calls into the page with
 * `injectJavaScript`, the page answers with `window.ReactNativeWebView.postMessage`.
 * Everything either side may send is typed here, and both import it, so a
 * change to the protocol breaks the build instead of a scan.
 */

/** The object the page installs on `window` for the app to call. */
export const PAGE_GLOBAL_NAME = '__textRecognitionPage';

/** The engine's files, base64-encoded, as the composed page hands them to `init`. */
export interface PageEnginePayload {
	/** onnxruntime's WebAssembly (`ort-wasm-simd-threaded.wasm`). */
	wasm: string;
	/** The text detection model. */
	detection: string;
	/** The text recognition model. */
	recognition: string;
	/** The character dictionary the recognition model indexes into. */
	dictionary: string;
}

/** One frame for the page to read. */
export interface RecognizeRequest {
	/** Chosen by the app; comes back on the answer so it can be matched. */
	id: string;
	/** The frame, base64-encoded. */
	imageBase64: string;
	/** Its media type, e.g. `image/jpeg`. */
	mimeType: string;
}

export type PageToAppMessage =
	/** The engine is up and takes frames. */
	| { type: 'ready' }
	/** The engine could not be started; nothing will be read. */
	| { type: 'init-failed'; message: string }
	/** One frame was read. `text` is the raw engine output, lines separated by `\n`. */
	| { type: 'result'; id: string; text: string; sharpness: number | null }
	/** One frame could not be read. */
	| { type: 'failed'; id: string; message: string };

const MESSAGE_TYPES: ReadonlySet<string> = new Set(['ready', 'init-failed', 'result', 'failed']);

/**
 * Parses what the page posted, or returns `null` for anything that is not one
 * of our messages — a WebView can post things of its own.
 */
export const parsePageMessage = (raw: string): PageToAppMessage | null => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (typeof parsed !== 'object' || parsed === null) {
		return null;
	}
	const candidate = parsed as { type?: unknown };
	if (typeof candidate.type !== 'string' || !MESSAGE_TYPES.has(candidate.type)) {
		return null;
	}
	return parsed as PageToAppMessage;
};

/**
 * The JavaScript the app injects to have one frame read.
 *
 * `injectJavaScript` wants a statement whose value is serializable, hence the
 * trailing `true` — react-native-webview documents it, and Android logs a
 * warning without it.
 */
export const buildRecognizeScript = (request: RecognizeRequest): string => `window.${PAGE_GLOBAL_NAME}.recognize(${JSON.stringify(request)}); true;`;

/** The JavaScript the composed page runs once the bundle is in place. */
export const buildInitScript = (payload: PageEnginePayload): string => `window.${PAGE_GLOBAL_NAME}.init(${JSON.stringify(payload)});`;
