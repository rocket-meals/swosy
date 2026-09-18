import { useCallback, useRef, useState } from 'react';
import type { PaddleOcrService } from 'ppu-paddle-ocr/web';

import { ENGINE_DIRECTORY_NAME, ENGINE_FILE_NAMES, MAX_RECOGNITION_IMAGE_WIDTH, ONNXRUNTIME_FILE_NAMES, RecognitionImage, RecognitionResult, SHARPNESS_MEASUREMENT_WIDTH, TextRecognitionApi, WEB_EXECUTION_PROVIDERS, describeReading, measureImageSharpness } from '@/helper/TextRecognitionShared';

/** The part of onnxruntime this file touches, once the page has loaded it. */
interface OnnxRuntime {
	env: { wasm: { wasmPaths: string } };
}

const getLoadedRuntime = (): OnnxRuntime | undefined => (globalThis as unknown as { ort?: OnnxRuntime }).ort;

/**
 * Loads the runtime into the page as a plain script.
 *
 * It is not bundled: its published bundles call `import(someVariable)` for
 * their own WebAssembly loader, and Metro fails the web build on a dynamic
 * import it cannot follow. Served from this app either way, so nothing is
 * fetched from anywhere else — see `public/paddleocr/README.md`.
 */
const loadRuntimeScript = async (engineDirectoryUrl: string): Promise<OnnxRuntime> => {
	const loaded = getLoadedRuntime();
	if (loaded) {
		return loaded;
	}
	const source = `${engineDirectoryUrl}/${ONNXRUNTIME_FILE_NAMES.library}`;
	await new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(`script[src="${source}"]`);
		if (existing) {
			existing.addEventListener('load', () => resolve());
			existing.addEventListener('error', () => reject(new Error('the text recognition runtime could not be loaded')));
			return;
		}
		const script = document.createElement('script');
		script.src = source;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('the text recognition runtime could not be loaded'));
		document.head.appendChild(script);
	});
	const runtime = getLoadedRuntime();
	if (!runtime) {
		throw new Error('the text recognition runtime could not be loaded');
	}
	return runtime;
};

/**
 * Where the bundled engine is served from — `public/paddleocr/`, which the web
 * export copies to the root of the deployment, below whatever base path the app
 * runs under (`/rocket-meals`, `/rocket-meals/pr-4399`, …). Expo inlines that
 * base path as `EXPO_BASE_URL` at build time; the fallback covers a dev server
 * serving from the root.
 */
const getEngineDirectoryUrl = (): string => {
	const basePath = process.env.EXPO_BASE_URL ?? '';
	const normalized = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
	return `${window.location.origin}${normalized}/${ENGINE_DIRECTORY_NAME}`;
};

/** Draws an image onto a canvas of the given width and hands back its pixels. */
const drawToCanvas = (image: HTMLImageElement, width: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | null => {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = Math.max(1, Math.round((image.height / image.width) * width));
	const context = canvas.getContext('2d', { willReadFrequently: true });
	if (!context) {
		return null;
	}
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	return { canvas, context };
};

/**
 * Scales the frame down so the engine works on something sensible, and measures
 * how sharp it is on the way past.
 */
const prepareFrame = async (imageUri: string): Promise<{ canvas: HTMLCanvasElement; sharpness: number | null }> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			const measured = drawToCanvas(image, Math.min(SHARPNESS_MEASUREMENT_WIDTH, image.width) || 1);
			const sharpness = measured === null ? null : measureImageSharpness(measured.context.getImageData(0, 0, measured.canvas.width, measured.canvas.height).data, measured.canvas.width, measured.canvas.height);

			const forEngine = drawToCanvas(image, Math.min(MAX_RECOGNITION_IMAGE_WIDTH, image.width) || 1);
			if (forEngine === null) {
				reject(new Error('image could not be prepared for text recognition'));
				return;
			}
			resolve({ canvas: forEngine.canvas, sharpness });
		};
		image.onerror = () => reject(new Error('image could not be prepared for text recognition'));
		image.src = imageUri;
	});

/**
 * Text recognition (OCR) in the browser — the web counterpart of
 * `useTextRecognition.tsx`.
 *
 * PaddleOCR on onnxruntime's WebAssembly build. Both the runtime and the models
 * come from this app's own origin: onnxruntime-web reaches for a CDN unless it
 * is told otherwise, and being told otherwise is the whole point. A photo of a
 * bank card should not tell a third party that someone is photographing a bank
 * card, and the picture itself never leaves the browser at all.
 */
export const useTextRecognition = (): TextRecognitionApi => {
	const servicePromise = useRef<Promise<PaddleOcrService> | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const getService = useCallback((): Promise<PaddleOcrService> => {
		if (servicePromise.current === null) {
			const engineDirectoryUrl = getEngineDirectoryUrl();
			setProgress(0);
			servicePromise.current = (async () => {
				const runtime = await loadRuntimeScript(engineDirectoryUrl);
				// Set before the runtime is first used, and unconditionally: the
				// library fills this in with a jsDelivr URL when it is loaded.
				runtime.env.wasm.wasmPaths = `${engineDirectoryUrl}/`;
				// Imported only now, because importing it reaches for the global
				// the script above installs.
				const { PaddleOcrService } = await import('ppu-paddle-ocr/web');
				const service = new PaddleOcrService({
					model: {
						detection: `${engineDirectoryUrl}/${ENGINE_FILE_NAMES.detection}`,
						recognition: `${engineDirectoryUrl}/${ENGINE_FILE_NAMES.recognition}`,
						charactersDictionary: `${engineDirectoryUrl}/${ENGINE_FILE_NAMES.charactersDictionary}`,
					},
					session: { executionProviders: [...WEB_EXECUTION_PROVIDERS] },
				});
				await service.initialize();
				setProgress(null);
				return service;
			})().catch((error: unknown) => {
				// A failed load must not be remembered as the engine, or every
				// later attempt would hand back the same rejection.
				servicePromise.current = null;
				setProgress(null);
				throw error;
			});
		}
		return servicePromise.current;
	}, []);

	const recognizeImage = useCallback(
		async (image: RecognitionImage): Promise<RecognitionResult> => {
			try {
				const prepared = await prepareFrame(image.uri);
				const service = await getService();
				const result = await service.recognize(prepared.canvas, { flatten: true });
				setErrorMessage(null);
				return describeReading(result.text ?? '', prepared.sharpness);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				setErrorMessage(message);
				throw new Error(message);
			}
		},
		[getService],
	);

	return { recognizeImage, progress, errorMessage };
};

export default useTextRecognition;
