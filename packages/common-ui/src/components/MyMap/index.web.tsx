import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { LIBERTY_STYLE_URL, MAP_STYLE_DEFINITIONS } from './MyMapHelper';
import type { MyMapHandle, MyMapProps } from './MyMapHelper';

const DEFAULT_ZOOM = 16;

const MyMap = forwardRef<MyMapHandle, MyMapProps>(
	({ initialCenter, loadingText, loadingOverlay, onMessage, centerAtUserLocationIfNoInitialPosition = true, injectScript, colorMap, mapStyleKey, hideLegalInfo }, ref) => {
		const iframeRef = useRef<HTMLIFrameElement>(null);
		const htmlBase = require('../../../assets/maplibre/index.html') as string;

		// Refs used to coordinate auto-centering on user location (only when no initialCenter is given).
		const locationForInitRef = useRef<{ lat: number; lng: number } | null>(null);
		const mapReadyRef = useRef(false);
		const initCenterSentRef = useRef(false);
		// Keep the latest colorMap and mapStyleKey values accessible inside the message handler.
		const colorMapRef = useRef(colorMap);
		const mapStyleKeyRef = useRef(mapStyleKey);

		// Overlay state: visible until MapComponentMounted fires.
		const [overlayVisible, setOverlayVisible] = useState(true);

		const iframeSrc = useMemo(
			// Computed only once: the iframe src is set on mount with the initial map position.
			// Subsequent position/marker updates are sent via sendToMap() messages so the iframe
			// doesn't reload.
			() => {
				const initialStyleKey = mapStyleKeyRef.current;
				const initialStyleUrl = initialStyleKey ? MAP_STYLE_DEFINITIONS[initialStyleKey]?.styleUrl : undefined;

				// Build query params systematically to avoid fragile string concatenation.
				const queryParts: string[] = [];
				if (initialCenter) {
					queryParts.push(`lat=${initialCenter.lat}`, `lng=${initialCenter.lng}`, `zoom=${DEFAULT_ZOOM}`);
				}
				if (initialStyleUrl && initialStyleUrl !== LIBERTY_STYLE_URL) {
					queryParts.push(`style=${encodeURIComponent(initialStyleUrl)}`);
				}
				if (loadingText) {
					queryParts.push(`loadingText=${encodeURIComponent(loadingText)}`);
				}
				if (hideLegalInfo) {
					queryParts.push('hideLegal=1');
				}
				const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
				return `${htmlBase}${query}`;
			},
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[],
		);

		const sendToMap = useCallback((data: object) => {
			if (iframeRef.current?.contentWindow) {
				iframeRef.current.contentWindow.postMessage(data, window.location.origin);
			}
		}, []);

		useImperativeHandle(ref, () => ({ sendToMap }), [sendToMap]);

		// When the colorMap prop changes, keep the ref up to date and apply the new colors.
		useEffect(() => {
			colorMapRef.current = colorMap;
			if (mapReadyRef.current) {
				sendToMap({ colorMap: colorMap ?? null });
			}
		}, [colorMap, sendToMap]);

		// When the mapStyleKey prop changes, switch the map style and apply the associated colorMap.
		useEffect(() => {
			mapStyleKeyRef.current = mapStyleKey;
			if (mapReadyRef.current) {
				if (mapStyleKey) {
					const def = MAP_STYLE_DEFINITIONS[mapStyleKey];
					if (def) {
						sendToMap({ mapStyle: def.styleUrl, colorMap: def.colorMap ?? null });
					}
				} else {
					sendToMap({ mapStyle: LIBERTY_STYLE_URL, colorMap: null });
				}
			}
		}, [mapStyleKey, sendToMap]);

		// When no initialCenter is provided and auto-center is enabled, request location on mount.
		useEffect(() => {
			if (initialCenter || centerAtUserLocationIfNoInitialPosition === false) return;
			(async () => {
				try {
					const { status } = await Location.requestForegroundPermissionsAsync();
					if (status !== 'granted') return;
					const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
					locationForInitRef.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
					if (mapReadyRef.current && !initCenterSentRef.current) {
						initCenterSentRef.current = true;
						sendToMap({ mapCenterPosition: locationForInitRef.current, animate: false });
					}
				} catch {
					// ignore – map stays at its default center
				}
			})();
		}, []); // eslint-disable-line react-hooks/exhaustive-deps

		useEffect(() => {
			const handler = (event: MessageEvent) => {
				try {
					const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
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
					// Hide the loading overlay when the map is ready.
					if (data.tag === 'MapComponentMounted') {
						mapReadyRef.current = true;
						setOverlayVisible(false);
						// Apply the initial color map once the style is fully loaded.
						// mapStyleKey takes priority: use its definition's colorMap; otherwise fall back to the colorMap prop.
						const currentStyleKey = mapStyleKeyRef.current;
						if (currentStyleKey) {
							const def = MAP_STYLE_DEFINITIONS[currentStyleKey];
							if (def?.colorMap) {
								sendToMap({ colorMap: def.colorMap });
							}
						} else if (colorMapRef.current) {
							sendToMap({ colorMap: colorMapRef.current });
						}
					}
					onMessage(data);
				} catch {
					// ignore malformed messages
				}
			};
			window.addEventListener('message', handler);
			return () => window.removeEventListener('message', handler);
		}, [onMessage, sendToMap, initialCenter, centerAtUserLocationIfNoInitialPosition]);

		const handleIframeLoad = useCallback(() => {
			if (!injectScript) return;
			try {
				const doc = iframeRef.current?.contentDocument;
				if (doc) {
					const script = doc.createElement('script');
					script.textContent = injectScript;
					doc.body.appendChild(script);
				}
			} catch {
				// Cross-origin or CSP restriction – silently ignore.
			}
		}, [injectScript]);

		return (
			<View style={styles.container}>
				<iframe
					ref={iframeRef}
					src={iframeSrc}
					style={{ width: '100%', height: '100%', border: 'none' }}
					title="OSM Vector Map"
					onLoad={handleIframeLoad}
				/>
				{loadingOverlay && overlayVisible && (
					<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
						{loadingOverlay}
					</View>
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
});
