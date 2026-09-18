import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { MAX_RECOGNITION_IMAGE_WIDTH, RECOGNITION_IMAGE_COMPRESSION, RecognitionImage, TESSERACT_BASE_URL, TextRecognitionApi, TextRecognitionEngineMessage, buildTextRecognitionPageHtml, splitRecognizedText } from '@/helper/TextRecognitionShared';

/** How long one recognition may take before it is given up on. */
const RECOGNITION_TIMEOUT_IN_MS = 60_000;

/**
 * Text recognition (OCR) on native, running Tesseract inside a hidden WebView.
 *
 * React Native has no WebAssembly, so Tesseract cannot run in the app's own JS
 * context — but it runs happily in a WebView, which every platform already has.
 * That is what buys this feature its independence from a native build: no new
 * module, no new binary, ships as an OTA update. The web build resolves
 * `useTextRecognition.web.tsx` instead and runs the same engine in the page.
 *
 * The caller must render `engineElement`; without it there is no WebView and
 * `recognizeLines` never resolves.
 */
export const useTextRecognition = (): TextRecognitionApi => {
	const webViewRef = useRef<WebView>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	/** Requests waiting for their answer from the page, by request id. */
	const pendingRequests = useRef(new Map<string, { resolve: (lines: string[]) => void; reject: (error: Error) => void }>());
	const nextRequestId = useRef(0);

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

	// The page is given the engine's own origin as its base URL. A WebView fed
	// plain HTML otherwise has an opaque origin, from which the engine's own
	// fetches (its worker, the wasm core, the language data) are a cross-origin
	// request that some WebView versions refuse outright.
	const engineElement = (
		<View style={styles.engineContainer} pointerEvents="none">
			<WebView ref={webViewRef} source={{ html: buildTextRecognitionPageHtml(), baseUrl: TESSERACT_BASE_URL }} originWhitelist={['*']} javaScriptEnabled domStorageEnabled onMessage={handleMessage} onError={() => setErrorMessage('text recognition engine could not be loaded')} />
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
