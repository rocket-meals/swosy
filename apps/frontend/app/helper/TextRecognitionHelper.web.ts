/**
 * Web counterpart of `TextRecognitionHelper.ts`.
 *
 * `expo-text-extractor` has no web implementation (its web stub reports
 * `isSupported: false`), so the browser is served by the Shape Detection API's
 * `TextDetector` where it exists — today that is Chrome on Android and ChromeOS.
 * Everywhere else text recognition is simply unavailable and the scanner says
 * so instead of spinning forever; the IBAN can still be typed in by hand.
 *
 * If browser-side OCR is ever needed on the desktop too, `tesseract.js` is the
 * candidate — it was left out on purpose here: it ships a ~30 MB wasm core and
 * fetches its language data from a CDN at runtime.
 */

interface DetectedText {
	rawValue: string;
}

interface TextDetectorLike {
	detect: (image: CanvasImageSource) => Promise<DetectedText[]>;
}

type TextDetectorConstructor = new () => TextDetectorLike;

const getTextDetectorConstructor = (): TextDetectorConstructor | undefined => {
	if (typeof window === 'undefined') {
		return undefined;
	}
	return (window as unknown as { TextDetector?: TextDetectorConstructor }).TextDetector;
};

export const isTextRecognitionSupported = (): boolean => getTextDetectorConstructor() !== undefined;

/** Loads an image URI (including a `data:` URI from the camera) into an element. */
const loadImage = async (imageUri: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('image could not be loaded for text recognition'));
		image.src = imageUri;
	});

/**
 * Recognizes the text in an image and returns it line by line.
 * Returns an empty array when the browser has no text detector.
 */
export const recognizeTextLines = async (imageUri: string): Promise<string[]> => {
	const TextDetectorConstructor = getTextDetectorConstructor();
	if (!TextDetectorConstructor) {
		return [];
	}
	const image = await loadImage(imageUri);
	const detector = new TextDetectorConstructor();
	const detected = await detector.detect(image);
	return detected.map((entry) => entry.rawValue).filter((line) => line.trim().length > 0);
};
