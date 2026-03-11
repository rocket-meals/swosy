import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { useAppSelector } from '@/redux/hooks';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';

const OsmVectorMapScreen: React.FC = () => {
	useSetPageTitle(TranslationKeys.osm_vector_map);
	const { theme } = useTheme();
	const webViewRef = useRef<WebView>(null);
	const [html, setHtml] = useState<string | null>(null);

	const { buildings } = useAppSelector((state) => state.canteenReducer);
	const selectedCanteen = useSelectedCanteen();

	const buildingCenter = useMemo(() => {
		if (selectedCanteen?.building) {
			const building = buildings.find((b) => b.id === selectedCanteen.building);
			const coords = (building as any)?.coordinates?.coordinates;
			if (coords && coords.length === 2) {
				return [Number(coords[0]), Number(coords[1])];
			}
		}
		return [10.0, 51.3];
	}, [selectedCanteen, buildings]);

	useEffect(() => {
		let isMounted = true;
		const loadHtml = async () => {
			const htmlAsset = Asset.fromModule(require('@/assets/maplibre/index.html'));
			await htmlAsset.downloadAsync();
			const htmlContent = await FileSystem.readAsStringAsync(htmlAsset.localUri!);
			if (isMounted) {
				setHtml(htmlContent);
			}
		};
		loadHtml();
		return () => {
			isMounted = false;
		};
	}, []);

	const sendCenter = useCallback(() => {
		const message = JSON.stringify({ center: buildingCenter, zoom: 14, animate: false });
		webViewRef.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${message}}));true;`);
	}, [buildingCenter]);

	const handleMessage = useCallback(
		(event: WebViewMessageEvent) => {
			try {
				const data = JSON.parse(event.nativeEvent.data);
				if (data.tag === 'MapLoaded') {
					sendCenter();
				}
			} catch {
				// ignore malformed messages
			}
		},
		[sendCenter],
	);

	const handleShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest): boolean => {
		const url = request.url;
		if (!url || url === 'about:blank' || url === 'about:srcdoc') {
			return true;
		}
		CommonSystemActionHelper.openExternalURL(url).catch(() => {});
		return false;
	}, []);

	if (!html) {
		return <View style={[styles.container, { backgroundColor: theme.screen.background }]} />;
	}

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<WebView
				ref={webViewRef}
				style={styles.webView}
				source={{ html }}
				javaScriptEnabled={true}
				domStorageEnabled={true}
				onMessage={handleMessage}
				onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	webView: {
		flex: 1,
	},
});

export default OsmVectorMapScreen;
