import { useCallback, useState } from 'react';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { MAX_RECOGNITION_IMAGE_WIDTH, RECOGNITION_IMAGE_COMPRESSION, RecognitionImage, RecognitionResult, TextRecognitionApi, describeReading } from '@/helper/TextRecognitionShared';
import { textRecognitionBridge } from '@/helper/textRecognitionPage/bridge';

/** The frames are handed over as JPEG; the page needs to know. */
const FRAME_MIME_TYPE = 'image/jpeg';

/** The message of whatever was thrown, prefixed with the step that threw it. */
const describeFailure = (step: string, error: unknown): string => `${step}: ${error instanceof Error ? error.message : String(error)}`;

/**
 * Text recognition (OCR) on a device.
 *
 * The same engine the browser runs — PaddleOCR on onnxruntime's WebAssembly
 * build, reading the models bundled in `public/paddleocr/` — inside a WebView
 * that `TextRecognitionWebViewHost` keeps at the root of the app. This hook
 * only prepares the frame and hands it across `textRecognitionBridge`; the
 * page does the reading and posts the text back. Nothing native is loaded for
 * it, nothing is fetched, and the picture never leaves the device.
 *
 * Taking the picture is somebody else's job. What arrives here is a finished
 * image; the camera is the platform's own and this file knows nothing about it.
 */
export const useTextRecognition = (): TextRecognitionApi => {
	const [progress, setProgress] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	/**
	 * Scales the frame down and hands back its bytes, base64-encoded for the
	 * trip into the WebView. A full-resolution photo would cost the engine
	 * time and memory it has no use for, and the bridge a string it cannot
	 * carry comfortably.
	 */
	const prepareFrame = useCallback(async (image: RecognitionImage): Promise<string> => {
		const context = ImageManipulator.manipulate(image.uri);
		if (image.width === undefined || image.width > MAX_RECOGNITION_IMAGE_WIDTH) {
			context.resize({ width: MAX_RECOGNITION_IMAGE_WIDTH });
		}
		const rendered = await context.renderAsync();
		const saved = await rendered.saveAsync({ compress: RECOGNITION_IMAGE_COMPRESSION, format: SaveFormat.JPEG });
		return new File(saved.uri).base64();
	}, []);

	const recognizeImage = useCallback(
		async (image: RecognitionImage): Promise<RecognitionResult> => {
			let imageBase64: string;
			try {
				imageBase64 = await prepareFrame(image);
			} catch (error) {
				const message = describeFailure('the photo could not be prepared for reading', error);
				setErrorMessage(message);
				throw new Error(message);
			}
			try {
				// The first frame is what starts the engine; the bridge says so
				// through its status, and the progress is shown until it is up.
				if (textRecognitionBridge.getStatus() !== 'ready') {
					setProgress(0);
				}
				const reading = await textRecognitionBridge.recognize(imageBase64, FRAME_MIME_TYPE);
				setProgress(null);
				setErrorMessage(null);
				return describeReading(reading.text, reading.sharpness);
			} catch (error) {
				setProgress(null);
				const message = error instanceof Error ? error.message : String(error);
				setErrorMessage(message);
				throw new Error(message);
			}
		},
		[prepareFrame],
	);

	return { recognizeImage, progress, errorMessage };
};

export default useTextRecognition;
