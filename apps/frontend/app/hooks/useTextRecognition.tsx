import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { ENGINE_FILE_NAMES, MAX_RECOGNITION_IMAGE_WIDTH, RECOGNITION_IMAGE_COMPRESSION, RecognitionImage, TextRecognitionApi, TextRecognitionEngineMessage, buildTextRecognitionPageHtml, splitRecognizedText } from '@/helper/TextRecognitionShared';

/** How long one recognition may take before it is given up on. */
const RECOGNITION_TIMEOUT_IN_MS = 60_000;

/** Where the engine is unpacked on the device. */
const ENGINE_DIRECTORY_NAME = 'text-recognition-engine';
const ENGINE_PAGE_NAME = 'index.html';

/**
 * The bundled engine, as Metro assets.
 *
 * Three of these are `.txt` copies of `.js` files. Metro bundles a `.js` file
 * as source code, never as an asset, so the engine's own scripts have to arrive
 * under a name Metro leaves alone — see `public/tesseract/README.md`. The two
 * large files carry extensions Metro already treats as assets and are taken
 * straight from the directory the web build serves.
 */
const ENGINE_ASSETS: { module: number; fileName: string }[] = [
	{ module: require('@/assets/tesseract/tesseract.min.js.txt'), fileName: ENGINE_FILE_NAMES.library },
	{ module: require('@/assets/tesseract/worker.min.js.txt'), fileName: ENGINE_FILE_NAMES.worker },
	{ module: require('@/assets/tesseract/tesseract-core-simd-lstm.js.txt'), fileName: ENGINE_FILE_NAMES.core },
	{ module: require('@/public/tesseract/tesseract-core-simd-lstm.wasm'), fileName: ENGINE_FILE_NAMES.coreWasm },
	{ module: require('@/public/tesseract/eng.traineddata.gz'), fileName: ENGINE_FILE_NAMES.trainedData },
];

/**
 * Unpacks the engine into the cache directory, once per install, and returns
 * the directory it landed in.
 *
 * The engine has to end up as real neighbouring files: its core loader looks
 * for its `.wasm` next to itself and the worker looks for the language data
 * next to itself, both by relative name. Scattering them is what makes the
 * library fall back to its CDN defaults, which is the one thing this must not
 * do.
 */
const unpackEngine = async (): Promise<string> => {
	const directory = `${FileSystem.cacheDirectory}${ENGINE_DIRECTORY_NAME}`;
	const directoryInfo = await FileSystem.getInfoAsync(directory);
	if (!directoryInfo.exists) {
		await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
	}

	for (const engineAsset of ENGINE_ASSETS) {
		const target = `${directory}/${engineAsset.fileName}`;
		const targetInfo = await FileSystem.getInfoAsync(target);
		if (targetInfo.exists) {
			continue;
		}
		const asset = Asset.fromModule(engineAsset.module);
		await asset.downloadAsync();
		if (!asset.localUri) {
			throw new Error(`text recognition engine file ${engineAsset.fileName} is missing`);
		}
		await FileSystem.copyAsync({ from: asset.localUri, to: target });
	}

	// Always rewritten: the page is ours, it is small, and it changes with the app.
	await FileSystem.writeAsStringAsync(`${directory}/${ENGINE_PAGE_NAME}`, buildTextRecognitionPageHtml());
	return directory;
};

/**
 * Text recognition (OCR) on native, running Tesseract inside a hidden WebView.
 *
 * React Native has no WebAssembly, so Tesseract cannot run in the app's own JS
 * context — but it runs in a WebView, which every platform already has. That is
 * what buys this feature its independence from a native build: no new module,
 * no new binary, ships as an OTA update. The engine itself is unpacked out of
 * the app onto the device, so it works offline and tells no one about it.
 *
 * The caller must render `engineElement`; without it there is no WebView and
 * `recognizeLines` never resolves.
 */
export const useTextRecognition = (): TextRecognitionApi => {
	const webViewRef = useRef<WebView>(null);
	const [engineDirectory, setEngineDirectory] = useState<string | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	/** Requests waiting for their answer from the page, by request id. */
	const pendingRequests = useRef(new Map<string, { resolve: (lines: string[]) => void; reject: (error: Error) => void }>());
	const nextRequestId = useRef(0);

	useEffect(() => {
		let isMounted = true;
		unpackEngine()
			.then((directory) => {
				if (isMounted) {
					setEngineDirectory(directory);
				}
			})
			.catch((error: unknown) => {
				if (isMounted) {
					setErrorMessage(error instanceof Error ? error.message : String(error));
				}
			});
		return () => {
			isMounted = false;
		};
	}, []);

	const handleMessage = useCallback((event: WebViewMessageEvent) => {
		let message: TextRecognitionEngineMessage;
		try {
			message = JSON.parse(event.nativeEvent.data) as TextRecognitionEngineMessage;
		} catch {
			return;
		}

		if (message.type === 'ready') {
			if (!message.engineLoaded) {
				setErrorMessage('text recognition engine could not be loaded');
			}
			return;
		}
		if (message.type === 'progress') {
			setProgress(message.progress);
			return;
		}
		if (message.type === 'result') {
			pendingRequests.current.get(message.id)?.resolve(splitRecognizedText(message.text));
			pendingRequests.current.delete(message.id);
			setProgress(null);
			return;
		}
		// An error either belongs to one request or to the engine as a whole.
		setErrorMessage(message.message);
		setProgress(null);
		if (message.id) {
			pendingRequests.current.get(message.id)?.reject(new Error(message.message));
			pendingRequests.current.delete(message.id);
		}
	}, []);

	/**
	 * Scales the frame down before it crosses the bridge: a full-resolution photo
	 * would be megabytes of base64 and would take the engine far longer to read.
	 */
	const toDataUri = useCallback(async (image: RecognitionImage): Promise<string> => {
		const context = ImageManipulator.manipulate(image.uri);
		if (image.width === undefined || image.width > MAX_RECOGNITION_IMAGE_WIDTH) {
			context.resize({ width: MAX_RECOGNITION_IMAGE_WIDTH });
		}
		const rendered = await context.renderAsync();
		const saved = await rendered.saveAsync({ base64: true, compress: RECOGNITION_IMAGE_COMPRESSION, format: SaveFormat.JPEG });
		if (!saved.base64) {
			throw new Error('image could not be prepared for text recognition');
		}
		return `data:image/jpeg;base64,${saved.base64}`;
	}, []);

	const recognizeLines = useCallback(
		async (image: RecognitionImage): Promise<string[]> => {
			const webView = webViewRef.current;
			if (!webView) {
				throw new Error('text recognition engine is not mounted');
			}
			const dataUri = await toDataUri(image);
			const requestId = `request-${nextRequestId.current++}`;

			return new Promise<string[]>((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					pendingRequests.current.delete(requestId);
					reject(new Error('text recognition timed out'));
				}, RECOGNITION_TIMEOUT_IN_MS);

				pendingRequests.current.set(requestId, {
					resolve: (lines) => {
						clearTimeout(timeoutId);
						resolve(lines);
					},
					reject: (error) => {
						clearTimeout(timeoutId);
						reject(error);
					},
				});

				const request = JSON.stringify({ id: requestId, image: dataUri });
				webView.injectJavaScript(`window.recognizeImage(${request}); true;`);
			});
		},
		[toDataUri],
	);

	// The page is loaded out of the engine directory rather than handed over as
	// a string, so that the engine's own relative lookups land on its
	// neighbours. That needs the WebView to be allowed to read that directory,
	// which is what the file-access props below are for.
	const engineElement =
		engineDirectory === null ? null : (
			<View style={styles.engineContainer} pointerEvents="none">
				<WebView ref={webViewRef} source={{ uri: `${engineDirectory}/${ENGINE_PAGE_NAME}` }} originWhitelist={['*']} allowFileAccess allowFileAccessFromFileURLs allowUniversalAccessFromFileURLs allowingReadAccessToURL={engineDirectory} javaScriptEnabled domStorageEnabled onMessage={handleMessage} onError={() => setErrorMessage('text recognition engine could not be loaded')} />
			</View>
		);

	return { recognizeLines, progress, errorMessage, engineElement };
};

const styles = StyleSheet.create({
	// The engine has no UI: it is kept at one pixel rather than at zero, because
	// a WebView with no size is not guaranteed to run its scripts.
	engineContainer: {
		position: 'absolute',
		width: 1,
		height: 1,
		opacity: 0,
	},
});

export default useTextRecognition;
