import { useCallback, useRef, useState } from 'react';

import { ENGINE_FILE_NAMES, MAX_RECOGNITION_IMAGE_WIDTH, RECOGNITION_IMAGE_COMPRESSION, RecognitionImage, TESSERACT_LANGUAGE, TextRecognitionApi, buildWorkerOptions, splitRecognizedText } from '@/helper/TextRecognitionShared';

interface TesseractWorker {
	recognize: (image: string) => Promise<{ data: { text: string } }>;
}

interface TesseractGlobal {
	createWorker: (language: string, oem: number, options: Record<string, unknown>) => Promise<TesseractWorker>;
}

const getTesseract = (): TesseractGlobal | undefined => (window as unknown as { Tesseract?: TesseractGlobal }).Tesseract;

/**
 * Where the bundled engine is served from — `public/tesseract/`, which the web
 * export copies to the root of the deployment, below whatever base path the app
 * runs under (`/rocket-meals`, `/rocket-meals/pr-4399`, …). Expo inlines that
 * base path as `EXPO_BASE_URL` at build time; the fallback covers a dev server
 * serving from the root.
 */
const getEngineDirectoryUrl = (): string => {
	const basePath = process.env.EXPO_BASE_URL ?? '';
	const normalized = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
	return `${window.location.origin}${normalized}/tesseract`;
};

/** Loads the engine into the page once; every later call reuses the script tag. */
const loadTesseract = async (engineDirectoryUrl: string): Promise<TesseractGlobal> => {
	const loaded = getTesseract();
	if (loaded) {
		return loaded;
	}
	const source = `${engineDirectoryUrl}/${ENGINE_FILE_NAMES.library}`;
	await new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(`script[src="${source}"]`);
		if (existing) {
			existing.addEventListener('load', () => resolve());
			existing.addEventListener('error', () => reject(new Error('text recognition engine could not be loaded')));
			return;
		}
		const script = document.createElement('script');
		script.src = source;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('text recognition engine could not be loaded'));
		document.head.appendChild(script);
	});
	const tesseract = getTesseract();
	if (!tesseract) {
		throw new Error('text recognition engine could not be loaded');
	}
	return tesseract;
};

/** Scales the frame down, so one pass stays near a second instead of ten. */
const scaleDown = async (imageUri: string): Promise<string> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			if (image.width <= MAX_RECOGNITION_IMAGE_WIDTH) {
				resolve(imageUri);
				return;
			}
			const canvas = document.createElement('canvas');
			const scale = MAX_RECOGNITION_IMAGE_WIDTH / image.width;
			canvas.width = MAX_RECOGNITION_IMAGE_WIDTH;
			canvas.height = Math.round(image.height * scale);
			const context = canvas.getContext('2d');
			if (!context) {
				resolve(imageUri);
				return;
			}
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			resolve(canvas.toDataURL('image/jpeg', RECOGNITION_IMAGE_COMPRESSION));
		};
		image.onerror = () => reject(new Error('image could not be prepared for text recognition'));
		image.src = imageUri;
	});

/**
 * Text recognition (OCR) in the browser — the web counterpart of
 * `useTextRecognition.tsx`. It runs the same engine, served from the app's own
 * origin, so no request for it ever leaves for a third party. Nothing to
 * render, so `engineElement` stays null.
 */
export const useTextRecognition = (): TextRecognitionApi => {
	const workerPromise = useRef<Promise<TesseractWorker> | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const getWorker = useCallback((): Promise<TesseractWorker> => {
		if (!workerPromise.current) {
			const engineDirectoryUrl = getEngineDirectoryUrl();
			workerPromise.current = loadTesseract(engineDirectoryUrl).then((tesseract) =>
				tesseract.createWorker(TESSERACT_LANGUAGE, 1, {
					...buildWorkerOptions(engineDirectoryUrl),
					logger: (entry: { progress?: number }) => {
						if (typeof entry.progress === 'number') {
							setProgress(entry.progress);
						}
					},
				}),
			);
		}
		return workerPromise.current;
	}, []);

	const recognizeLines = useCallback(
		async (image: RecognitionImage): Promise<string[]> => {
			try {
				const worker = await getWorker();
				const prepared = await scaleDown(image.uri);
				const result = await worker.recognize(prepared);
				setProgress(null);
				setErrorMessage(null);
				return splitRecognizedText(result.data.text);
			} catch (error) {
				// A worker that failed to start stays broken; drop it so the next
				// attempt builds a fresh one.
				workerPromise.current = null;
				setProgress(null);
				setErrorMessage(error instanceof Error ? error.message : String(error));
				throw error;
			}
		},
		[getWorker],
	);

	return { recognizeLines, progress, errorMessage, engineElement: null };
};

export default useTextRecognition;
