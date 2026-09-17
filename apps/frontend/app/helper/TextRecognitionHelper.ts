/**
 * On-device text recognition (OCR) for a photo taken with the camera.
 *
 * Native uses `expo-text-extractor`, which is ML Kit on Android and Apple Vision
 * on iOS — both run fully offline, so a photographed bank card never leaves the
 * device. The web build resolves `TextRecognitionHelper.web.ts` instead.
 *
 * The module is a native one, so it is required lazily and behind a guard: in a
 * client without the native part built in (Expo Go, an older binary running a
 * newer OTA bundle) the import throws, and a screen that merely offers scanning
 * must not go down with it.
 */

interface TextExtractorModule {
	isSupported: boolean;
	extractTextFromImage: (uri: string) => Promise<string[]>;
}

let cachedModule: TextExtractorModule | null | undefined;

const getTextExtractorModule = (): TextExtractorModule | null => {
	if (cachedModule !== undefined) {
		return cachedModule;
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		cachedModule = require('expo-text-extractor') as TextExtractorModule;
	} catch {
		cachedModule = null;
	}
	return cachedModule;
};

export const isTextRecognitionSupported = (): boolean => getTextExtractorModule()?.isSupported === true;

/**
 * Recognizes the text in an image and returns it line by line.
 * Returns an empty array when the image holds no readable text.
 */
export const recognizeTextLines = async (imageUri: string): Promise<string[]> => {
	const textExtractor = getTextExtractorModule();
	if (!textExtractor?.isSupported) {
		return [];
	}
	const recognized = await textExtractor.extractTextFromImage(imageUri);
	return recognized.filter((line) => line.trim().length > 0);
};
