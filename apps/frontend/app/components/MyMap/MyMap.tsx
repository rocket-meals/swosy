import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import type { LeafletWebViewEvent } from './model';
import { MyMapProps } from '@/components/MyMap/MyMapHelper';
import DEFAULT_TILE_LAYER from './defaultTileLayer';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { clusterMarkers } from './clusterUtils';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';

const MyMap: React.FC<MyMapProps> = ({ mapCenterPosition, zoom, mapMarkers, mapLayers, useFlyAnimation, onMarkerClick, onMapEvent, renderMarkerModal, onMarkerSelectionChange }) => {
	const webViewRef = useRef<WebView>(null);
	const [html, setHtml] = useState<string | null>(null);
	const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
	const [currentZoom, setCurrentZoom] = useState(zoom ?? 13);

	useEffect(() => {
		setCurrentZoom(zoom ?? 13);
	}, [zoom]);

	useEffect(() => {
		let isMounted = true;
		const loadHtml = async () => {
			const htmlAsset = Asset.fromModule(require('@/assets/leaflet/index.html'));
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

	useEffect(() => {
		onMarkerSelectionChange?.(selectedMarker);
	}, [selectedMarker, onMarkerSelectionChange]);

	const clusteredMarkers = useMemo(() => clusterMarkers(mapMarkers ?? [], currentZoom), [mapMarkers, currentZoom]);

	const sendMapData = useCallback(() => {
		const message = {
			mapCenterPosition,
			zoom: zoom ?? 13,
			mapLayers: mapLayers ?? [DEFAULT_TILE_LAYER],
			mapMarkers: clusteredMarkers,
			useFlyAnimation: useFlyAnimation !== false,
		};
		const json = JSON.stringify(message);
		webViewRef.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${json}}));true;`);
	}, [mapCenterPosition, zoom, mapLayers, clusteredMarkers, useFlyAnimation]);

	useEffect(() => {
		sendMapData();
	}, [sendMapData]);

	const handleShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest): boolean => {
		const url = request.url;
		// Allow the initial blank page load that React Native WebView uses for inline HTML
		if (!url || url === 'about:blank' || url === 'about:srcdoc') {
			return true;
		}
		// Open all other navigation requests (e.g. Leaflet attribution links) externally
		CommonSystemActionHelper.openExternalURL(url).catch(() => {});
		return false;
	}, []);

	const handleMessage = useCallback(
		(event: WebViewMessageEvent) => {
			try {
				const data: LeafletWebViewEvent = JSON.parse(event.nativeEvent.data);
				if (data.tag === 'MapComponentMounted') {
					sendMapData();
					return;
				}
				if (data.tag === 'onZoomEnd') {
					setCurrentZoom(data.zoom);
				}
				if (data.tag === 'onMapMarkerClicked') {
					onMarkerClick?.(data.mapMarkerId);
					onMarkerSelectionChange?.(data.mapMarkerId);
					if (renderMarkerModal) {
						setSelectedMarker(data.mapMarkerId);
					}
				}
				onMapEvent?.(data);
			} catch {
				// ignore malformed messages
			}
		},
		[sendMapData, onMarkerClick, onMapEvent, renderMarkerModal, onMarkerSelectionChange],
	);

	if (!html) {
		return null;
	}

	return (
		<View style={styles.container}>
			<WebView
				ref={webViewRef}
				source={{ html }}
				onMessage={handleMessage}
				onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
				style={styles.map}
				javaScriptEnabled={true}
				domStorageEnabled={true}
				originWhitelist={['*']}
			/>
		</View>
	);
};

export default MyMap;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	map: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
});
