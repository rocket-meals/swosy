import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { useAppSelector } from '@/redux/hooks';

const OsmVectorMapScreen: React.FC = () => {
	useSetPageTitle(TranslationKeys.osm_vector_map);
	const { theme } = useTheme();
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const html = require('@/assets/maplibre/index.html');

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

	const sendCenter = useCallback(() => {
		if (iframeRef.current && iframeRef.current.contentWindow) {
			const message = { center: buildingCenter, zoom: 14, animate: false };
			iframeRef.current.contentWindow.postMessage(message, window.location.origin);
		}
	}, [buildingCenter]);

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			try {
				const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
				if (data.tag === 'MapLoaded') {
					sendCenter();
				}
			} catch {
				// ignore malformed messages
			}
		};
		window.addEventListener('message', handler);
		return () => window.removeEventListener('message', handler);
	}, [sendCenter]);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<iframe ref={iframeRef} src={html} style={{ width: '100%', height: '100%', border: 'none' }} onLoad={sendCenter} title="OSM Vector Map" />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default OsmVectorMapScreen;
