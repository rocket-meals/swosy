import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Linking, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { StringHelper } from 'repo-depkit-common';
import type { MyMapHandle, MyMapProps } from './MyMapHelper';

function escapeHtml(text: string): string {
	let result = StringHelper.replaceAllLiteralWithOptions({ str: text, find: '&', replace: '&amp;' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: '<', replace: '&lt;' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: '>', replace: '&gt;' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: '"', replace: '&quot;' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: "'", replace: '&#39;' });
	return result;
}

const MyMap = forwardRef<MyMapHandle, MyMapProps>(
	({ initialCenter, initialZoom, initialPitch, loadingText, loadingOverlay, onMessage, centerAtUserLocationIfNoInitialPosition = true, injectScript }, ref) => {
		const webViewRef = useRef<WebView>(null);
		// The HTML is written to a local cache file and loaded via a file:// URI so that the WebView
		// has a proper file:// origin and can fetch sibling local assets (e.g. GLB models, PNG tiles)
		// without the "URL is not valid or contains user credentials" error that occurs when loading
		// resources from a null-origin WebView (source={{ html }}).
		// Note: this file (index.tsx) is the native-only implementation; the web build uses
		// index.web.tsx which serves the map via an iframe and doesn't need this approach.
		const [htmlUri, setHtmlUri] = useState<string | null>(null);

		// Overlay state: visible until MapComponentMounted fires, then fades out.
		const [overlayVisible, setOverlayVisible] = useState(true);
		const overlayOpacity = useRef(new Animated.Value(1)).current;

		// Refs used to coordinate auto-centering on user location (only when no initialCenter is given).
		const locationForInitRef = useRef<{ lat: number; lng: number } | null>(null);
		const mapReadyRef = useRef(false);
		const initCenterSentRef = useRef(false);

		useEffect(() => {
			let isMounted = true;
			const loadHtml = async () => {
				const htmlAsset = Asset.fromModule(require('../../../assets/maplibre/index.html'));
				await htmlAsset.downloadAsync();
				let htmlContent = await FileSystem.readAsStringAsync(htmlAsset.localUri!);
				if (initialCenter) {
					const zoomArg = initialZoom !== undefined ? `${initialZoom}` : 'null';
					const pitch = initialPitch !== undefined ? `, ${initialPitch}` : '';
					htmlContent = StringHelper.replaceAllLiteralWithOptions({
						str: htmlContent,
						find: 'initMap(null, null);',
						replace: `initMap([${initialCenter.lng}, ${initialCenter.lat}], ${zoomArg}${pitch});`,
					});
				} else if (initialZoom !== undefined) {
					htmlContent = StringHelper.replaceAllLiteralWithOptions({
						str: htmlContent,
						find: 'initMap(null, null);',
						replace: `initMap(null, ${initialZoom});`,
					});
				}
				if (loadingText) {
					htmlContent = StringHelper.replaceAllLiteralWithOptions({
						str: htmlContent,
						find: '<span id="loading-text">Loading vector map…</span>',
						replace: `<span id="loading-text">${escapeHtml(loadingText)}</span>`,
					});
				}
				if (injectScript) {
					htmlContent = StringHelper.replaceAllLiteralWithOptions({
						str: htmlContent,
						find: '// INJECT_SCRIPT_HERE',
						replace: injectScript,
					});
				}
				if (isMounted) {
					// Write the (possibly patched) HTML to a local cache file so the WebView can be
					// loaded from a file:// URI instead of inline HTML.  A file:// origin allows the
					// WebView to fetch sibling local assets (GLB models, PNG tiles) without the
					// browser rejecting them as invalid URLs.
					const cacheDir = (FileSystem.cacheDirectory ?? '') + 'mymap_v1/';
					const htmlFilePath = cacheDir + 'index.html';
					await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
					await FileSystem.writeAsStringAsync(htmlFilePath, htmlContent);
					setHtmlUri(htmlFilePath);
				}
			};
			loadHtml();
			return () => {
				isMounted = false;
			};
			// initialCenter, initialPitch, and centerAtUserLocationIfNoInitialPosition are intentionally
			// excluded: the HTML is loaded only once on mount. Subsequent updates go via sendToMap().
		}, []); // eslint-disable-line react-hooks/exhaustive-deps

		const sendToMap = useCallback((data: object) => {
			const json = JSON.stringify(data);
			webViewRef.current?.injectJavaScript(
				`window.dispatchEvent(new MessageEvent('message',{data:${json}}));true;`,
			);
		}, []);

		useImperativeHandle(ref, () => ({ sendToMap }), [sendToMap]);

		// When no initialCenter is provided and auto-center is enabled, request location on mount.
		useEffect(() => {
			if (initialCenter || centerAtUserLocationIfNoInitialPosition === false) return;
			(async () => {
				try {
					const { status } = await Location.requestForegroundPermissionsAsync();
					if (status !== 'granted') return;
					const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
					locationForInitRef.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
					// If the map is already ready, send the center now; otherwise the handleMessage
					// callback will send it when MapComponentMounted is received.
					if (mapReadyRef.current && !initCenterSentRef.current) {
						initCenterSentRef.current = true;
						sendToMap({ mapCenterPosition: locationForInitRef.current, zoom: initialZoom, animate: false });
					}
				} catch {
					// ignore – map stays at its default center
				}
			})();
		}, []); // eslint-disable-line react-hooks/exhaustive-deps

		const handleMessage = useCallback(
			(event: WebViewMessageEvent) => {
				try {
					const data = JSON.parse(event.nativeEvent.data);
					// When the map signals it is ready and we need to auto-center, send the queued location.
					if (
						data.tag === 'MapComponentMounted' &&
						!initialCenter &&
						centerAtUserLocationIfNoInitialPosition !== false
					) {
						mapReadyRef.current = true;
						if (locationForInitRef.current && !initCenterSentRef.current) {
							initCenterSentRef.current = true;
							sendToMap({ mapCenterPosition: locationForInitRef.current, zoom: initialZoom, animate: false });
						}
					}
					// Fade out and remove the loading overlay when the map is ready.
					if (data.tag === 'MapComponentMounted') {
						Animated.timing(overlayOpacity, {
							toValue: 0,
							duration: 600,
							useNativeDriver: true,
						}).start(() => setOverlayVisible(false));
					}
					onMessage(data);
				} catch {
					// ignore malformed messages
				}
			},
			[onMessage, sendToMap, initialCenter, centerAtUserLocationIfNoInitialPosition],
		);

		const handleShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest): boolean => {
			const url = request.url;
			// Allow the initial file:// HTML load and any in-page file:// resource navigations.
			if (!url || url === 'about:blank' || url === 'about:srcdoc' || url.startsWith('file://')) {
				return true;
			}
			Linking.openURL(url).catch(() => {});
			return false;
		}, []);

		if (!htmlUri) {
			return <View style={styles.container} />;
		}

		return (
			<View style={styles.container}>
				<WebView
					ref={webViewRef}
					style={styles.webView}
					source={{ uri: htmlUri }}
					javaScriptEnabled={true}
					domStorageEnabled={true}
					originWhitelist={['*']}
					// Allow reading local files from the cache directory (needed for GLB models / images).
					allowFileAccess={true}
					allowingReadAccessToURL={FileSystem.cacheDirectory ?? ''}
					onMessage={handleMessage}
					onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
				/>
				{loadingOverlay && overlayVisible && (
					<Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]} pointerEvents="box-none">
						{loadingOverlay}
					</Animated.View>
				)}
			</View>
		);
	},
);

export default MyMap;
export type { MyMapHandle, MyMapProps };

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	webView: {
		flex: 1,
	},
});
