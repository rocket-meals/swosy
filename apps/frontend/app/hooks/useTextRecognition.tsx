import { useCallback, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Skia } from '@shopify/react-native-skia';
import { PaddleOcrService } from 'ppu-paddle-ocr/mobile';

import { MAX_RECOGNITION_IMAGE_WIDTH, RECOGNITION_IMAGE_COMPRESSION, RecognitionImage, RecognitionResult, SHARPNESS_MEASUREMENT_WIDTH, TextRecognitionApi, describeReading, measureImageSharpness } from '@/helper/TextRecognitionShared';

/**
 * The models, as Metro assets.
 *
 * Resolved when first needed rather than at import time: a `require` that fails
 * at module level takes the whole screen down with it, and an engine that
 * cannot be found should show a message in the sheet instead.
 */
const loadModelModules = (): { detection: number; recognition: number; charactersDictionary: number } => ({
	detection: require('@/public/paddleocr/PP-OCRv6_tiny_det.ort'),
	recognition: require('@/public/paddleocr/PP-OCRv6_tiny_rec.ort'),
	charactersDictionary: require('@/public/paddleocr/ppocrv6_tiny_dict.txt'),
});

/** The message of whatever was thrown, prefixed with the step that threw it. */
const describeFailure = (step: string, error: unknown): string => `${step}: ${error instanceof Error ? error.message : String(error)}`;

/**
 * Reads one bundled asset into memory.
 *
 * The engine takes the model bytes, not a path: `fetch` cannot read a `file://`
 * URI in React Native, so handing it a URL would send it looking on the network
 * — which is exactly what must not happen.
 */
const readAsset = async (assetModule: number): Promise<ArrayBuffer> => {
	const asset = Asset.fromModule(assetModule);
	await asset.downloadAsync();
	if (!asset.localUri) {
		throw new Error('it has no local copy on this device');
	}
	return new File(asset.localUri).arrayBuffer();
};

/**
 * How sharp the photo is, or `null` when it could not be measured.
 *
 * Decoding is Skia's, which the engine brings along anyway. A failure here is
 * not worth reporting: the measurement exists to explain an empty reading, and
 * an explanation that cannot be produced simply is not given.
 */
const measureSharpness = async (imageUri: string): Promise<number | null> => {
	try {
		const data = await Skia.Data.fromURI(imageUri);
		const encoded = Skia.Image.MakeImageFromEncoded(data);
		if (!encoded) {
			return null;
		}
		// Scaled to the same width the browser measures at, so the number means
		// the same thing on both sides.
		const width = Math.min(SHARPNESS_MEASUREMENT_WIDTH, encoded.width());
		const height = Math.max(1, Math.round((encoded.height() / encoded.width()) * width));
		const surface = Skia.Surface.MakeOffscreen(width, height);
		if (!surface) {
			return null;
		}
		surface.getCanvas().drawImageRect(encoded, { x: 0, y: 0, width: encoded.width(), height: encoded.height() }, { x: 0, y: 0, width, height }, Skia.Paint());
		surface.flush();
		const pixels = surface.makeImageSnapshot().readPixels();
		if (!pixels || pixels instanceof Float32Array) {
			return null;
		}
		return measureImageSharpness(new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.byteLength), width, height);
	} catch {
		return null;
	}
};

/**
 * Text recognition (OCR) on a device.
 *
 * PaddleOCR on onnxruntime's native runtime, with Skia doing the image work.
 * Both models are bundled with the app and read off the device, so this works
 * offline and tells no one about it.
 *
 * Taking the picture is somebody else's job. What arrives here is a finished
 * image; the camera is the platform's own and this file knows nothing about it.
 */
export const useTextRecognition = (): TextRecognitionApi => {
	const servicePromise = useRef<Promise<PaddleOcrService> | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const getService = useCallback((): Promise<PaddleOcrService> => {
		if (servicePromise.current === null) {
			setProgress(0);
			servicePromise.current = (async () => {
				let modules: ReturnType<typeof loadModelModules>;
				try {
					modules = loadModelModules();
				} catch (error) {
					throw new Error(describeFailure('the text recognition models are not bundled with this app version', error));
				}
				let model: { detection: ArrayBuffer; recognition: ArrayBuffer; charactersDictionary: ArrayBuffer };
				try {
					model = {
						detection: await readAsset(modules.detection),
						recognition: await readAsset(modules.recognition),
						charactersDictionary: await readAsset(modules.charactersDictionary),
					};
				} catch (error) {
					throw new Error(describeFailure('the text recognition models could not be unpacked', error));
				}
				try {
					const service = new PaddleOcrService({ model });
					await service.initialize();
					setProgress(null);
					return service;
				} catch (error) {
					throw new Error(describeFailure('the text recognition engine could not be started', error));
				}
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

	/**
	 * Scales the frame down and hands back its bytes. A full-resolution photo
	 * would cost the engine time and memory it has no use for.
	 */
	const prepareFrame = useCallback(async (image: RecognitionImage): Promise<{ bytes: ArrayBuffer; uri: string }> => {
		const context = ImageManipulator.manipulate(image.uri);
		if (image.width === undefined || image.width > MAX_RECOGNITION_IMAGE_WIDTH) {
			context.resize({ width: MAX_RECOGNITION_IMAGE_WIDTH });
		}
		const rendered = await context.renderAsync();
		const saved = await rendered.saveAsync({ compress: RECOGNITION_IMAGE_COMPRESSION, format: SaveFormat.JPEG });
		return { bytes: await new File(saved.uri).arrayBuffer(), uri: saved.uri };
	}, []);

	const recognizeImage = useCallback(
		async (image: RecognitionImage): Promise<RecognitionResult> => {
			let prepared: { bytes: ArrayBuffer; uri: string };
			try {
				prepared = await prepareFrame(image);
			} catch (error) {
				const message = describeFailure('the photo could not be prepared for reading', error);
				setErrorMessage(message);
				throw new Error(message);
			}
			try {
				const service = await getService();
				const result = await service.recognize(prepared.bytes, { flatten: true });
				setErrorMessage(null);
				return describeReading(result.text ?? '', await measureSharpness(prepared.uri));
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				setErrorMessage(message);
				throw new Error(message);
			}
		},
		[getService, prepareFrame],
	);

	return { recognizeImage, progress, errorMessage };
};

export default useTextRecognition;
