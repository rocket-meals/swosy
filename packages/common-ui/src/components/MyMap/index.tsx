import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
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
	({ initialCenter, initialPitch, loadingText, onMessage, centerAtUserLocationIfNoInitialPosition = true, injectScript }, ref) => {
		const webViewRef = useRef<WebView>(null);
		const [html, setHtml] = useState<string | null>(null);

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
					const pitch = initialPitch !== undefined ? `, ${initialPitch}` : '';
					htmlContent = StringHelper.replaceAllLiteralWithOptions({
						str: htmlContent,
						find: 'initMap(null, null);',
						replace: `initMap([${initialCenter.lng}, ${initialCenter.lat}], null${pitch});`,
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
					setHtml(htmlContent);
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
						sendToMap({ mapCenterPosition: locationForInitRef.current, animate: false });
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
							sendToMap({ mapCenterPosition: locationForInitRef.current, animate: false });
						}
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
			if (!url || url === 'about:blank' || url === 'about:srcdoc') {
				return true;
			}
			Linking.openURL(url).catch(() => {});
			return false;
		}, []);

		if (!html) {
			return <View style={styles.container} />;
		}

		return (
			<View style={styles.container}>
				<WebView
					ref={webViewRef}
					style={styles.webView}
					source={{ html }}
					javaScriptEnabled={true}
					domStorageEnabled={true}
					originWhitelist={['*']}
					onMessage={handleMessage}
					onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
				/>
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
