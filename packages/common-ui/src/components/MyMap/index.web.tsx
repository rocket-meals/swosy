import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import type { MyMapHandle, MyMapProps } from './MyMapHelper';

const DEFAULT_ZOOM = 16;

const MyMap = forwardRef<MyMapHandle, MyMapProps>(
	({ initialCenter, loadingText, onMessage, centerAtUserLocationIfNoInitialPosition = true }, ref) => {
		const iframeRef = useRef<HTMLIFrameElement>(null);
		const htmlBase = require('../../../assets/maplibre/index.html') as string;

		// Refs used to coordinate auto-centering on user location (only when no initialCenter is given).
		const locationForInitRef = useRef<{ lat: number; lng: number } | null>(null);
		const mapReadyRef = useRef(false);
		const initCenterSentRef = useRef(false);

		const iframeSrc = useMemo(
			// Computed only once: the iframe src is set on mount with the initial map position.
			// Subsequent position/marker updates are sent via sendToMap() messages so the iframe
			// doesn't reload.
			() => {
				if (initialCenter) {
					let src = `${htmlBase}?lat=${initialCenter.lat}&lng=${initialCenter.lng}&zoom=${DEFAULT_ZOOM}`;
					if (loadingText) {
						src += `&loadingText=${encodeURIComponent(loadingText)}`;
					}
					return src;
				}
				// No initialCenter – load with default position; auto-center will be sent after the map is ready.
				let src = htmlBase as string;
				if (loadingText) {
					src += `?loadingText=${encodeURIComponent(loadingText)}`;
				}
				return src;
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
					onMessage(data);
				} catch {
					// ignore malformed messages
				}
			};
			window.addEventListener('message', handler);
			return () => window.removeEventListener('message', handler);
		}, [onMessage, sendToMap, initialCenter, centerAtUserLocationIfNoInitialPosition]);

		return (
			<View style={styles.container}>
				<iframe
					ref={iframeRef}
					src={iframeSrc}
					style={{ width: '100%', height: '100%', border: 'none' }}
					title="OSM Vector Map"
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
});
