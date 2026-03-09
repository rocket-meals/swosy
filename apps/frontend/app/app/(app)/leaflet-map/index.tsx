import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MyMap from '@/components/MyMap/MyMap';
import { MARKER_DEFAULT_SIZE } from '@/components/MyMap/markerUtils';
import { LeafletWebViewEvent, MapMarker } from '@/components/MyMap/model';
import { useTheme } from '@/hooks/useTheme';
import { clusterMarkers } from '@/components/MyMap/clusterUtils';
import { DatabaseTypes } from 'repo-depkit-common';
import useBuildingDetailsModal from '@/hooks/useBuildingDetailsModal';

type BuildingCoordinates = { coordinates?: [number, number] } | null;

const POSITION_BUNDESTAG = {
	lat: 52.518594247456804,
	lng: 13.376281624711964,
};

const MAX_LOG_ENTRIES = 50;

const MAX_ZOOM = 18;
const DEFAULT_ZOOM = 17;

const BUILDING_MARKER_SIZE = MARKER_DEFAULT_SIZE;
const BUILDING_MARKER_COLOR = '#1565c0';
const MAX_BUILDING_LABEL_CHARS = 3;

function createBuildingMarkerSvg(externalIdentifier?: string | null): string {
	const size = BUILDING_MARKER_SIZE;
	const cx = size / 2;
	const cy = size / 2;
	const r = cx - 2;
	const label = externalIdentifier ? externalIdentifier.slice(0, MAX_BUILDING_LABEL_CHARS) : null;
	const circleEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${BUILDING_MARKER_COLOR}" stroke="white" stroke-width="2" opacity="0.9"/>`;
	const textEl = label
		? `<text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial,sans-serif" font-size="12" font-weight="bold">${label}</text>`
		: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${circleEl}${textEl}</svg>`;
}

const LeafletMap = () => {
	useSetPageTitle(TranslationKeys.leaflet_map);

	const { buildings } = useAppSelector((state) => state.canteenReducer);
	const selectedCanteen = useSelectedCanteen();
	const { openBuildingDetailsModal } = useBuildingDetailsModal();
	const { theme } = useTheme();

	const [logEntries, setLogEntries] = useState<string[]>([]);
	const logScrollRef = useRef<ScrollView>(null);

	// Tracked zoom level – updated when the Leaflet map reports onZoomEnd
	const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
	// Override center position set on cluster click (null = follow centerPosition)
	const [mapCenterOverride, setMapCenterOverride] = useState<{ lat: number; lng: number } | null>(null);

	const addLog = useCallback((entry: string) => {
		setLogEntries((prev) => {
			const next = [...prev, `${new Date().toLocaleTimeString()}: ${entry}`];
			return next.length > MAX_LOG_ENTRIES ? next.slice(next.length - MAX_LOG_ENTRIES) : next;
		});
	}, []);

	const centerPosition = useMemo(() => {
		if (selectedCanteen?.building) {
			const building = buildings.find((b: DatabaseTypes.Buildings) => b.id === selectedCanteen.building);
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			if (coords && coords.length === 2) {
				return { lat: Number(coords[1]), lng: Number(coords[0]) };
			}
		}
		return POSITION_BUNDESTAG;
	}, [selectedCanteen, buildings]);

	// Build markers for all buildings that have valid coordinates
	const buildingMarkers = useMemo((): MapMarker[] => {
		return (buildings as DatabaseTypes.Buildings[])
			.filter((building) => {
				const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
				return coords && coords.length === 2;
			})
			.map((building) => {
				const coords = (building.coordinates as BuildingCoordinates)!.coordinates!;
				const [lng, lat] = coords;
				return {
					id: `building-${building.id}`,
					position: { lat: Number(lat), lng: Number(lng) },
					icon: createBuildingMarkerSvg(building.external_identifier),
					size: [BUILDING_MARKER_SIZE, BUILDING_MARKER_SIZE] as [number, number],
					iconAnchor: [BUILDING_MARKER_SIZE / 2, BUILDING_MARKER_SIZE / 2] as [number, number],
				};
			});
	}, [buildings]);

	// Pre-computed clustered markers at the current zoom – reused for cluster click handling
	const clusteredBuildingMarkers = useMemo(() => clusterMarkers(buildingMarkers, mapZoom), [buildingMarkers, mapZoom]);

	// Reset the centre override when the selected canteen changes so the map
	// returns to the canteen's building position.
	useEffect(() => {
		setMapCenterOverride(null);
	}, [centerPosition]);

	const handleMarkerClick = useCallback(
		(id: string) => {
			// Cluster click: zoom in and centre on the cluster instead of opening a modal
			if (id.startsWith('cluster:')) {
				const cluster = clusteredBuildingMarkers.find((m) => m.id === id);
				if (cluster) {
					setMapCenterOverride(cluster.position);
					setMapZoom((prev) => Math.min(prev + 2, MAX_ZOOM));
				}
				addLog(`Cluster clicked: ${id}`);
				return;
			}

			const buildingId = id.startsWith('building-') ? id.slice('building-'.length) : null;
			const building = buildingId ? (buildings as DatabaseTypes.Buildings[]).find((b) => b.id === buildingId) : null;

			const title = building?.alias ?? id;
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			const lat = coords ? Number(coords[1]).toFixed(5) : null;
			const lng = coords ? Number(coords[0]).toFixed(5) : null;

			addLog(`Marker clicked: ${title}${lat !== null ? ` (${lat}, ${lng})` : ''}`);

			if (buildingId) {
				openBuildingDetailsModal(buildingId);
			}
		},
		[buildings, clusteredBuildingMarkers, openBuildingDetailsModal, addLog],
	);

	const handleMapEvent = useCallback(
		(e: LeafletWebViewEvent) => {
			if (e.tag === 'onZoomEnd') {
				setMapZoom(e.zoom);
				addLog(`Zoom: ${e.zoom ?? 'unknown'}`);
			} else if (e.tag === 'MapComponentMounted' || e.tag === 'MapReady') {
				addLog(e.tag);
			} else if (e.tag === 'DebugMessage') {
				addLog(`Debug: ${e.message}`);
			}
		},
		[addLog],
	);

	return (
		<View style={styles.container}>
			<MyMap
				mapCenterPosition={mapCenterOverride ?? centerPosition}
				zoom={mapZoom}
				mapMarkers={buildingMarkers}
				onMarkerClick={handleMarkerClick}
				onMapEvent={handleMapEvent}
			/>
			<ScrollView
				ref={logScrollRef}
				style={[styles.logContainer, { backgroundColor: theme.screen.background, borderTopColor: theme.screen.text + '33' }]}
				onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: true })}
			>
				{logEntries.map((entry, i) => (
					<Text key={i} style={[styles.logEntry, { color: theme.screen.text }]} selectable>
						{entry}
					</Text>
				))}
				{logEntries.length === 0 && (
					<Text style={[styles.logPlaceholder, { color: theme.screen.text + '88' }]}>Map log…</Text>
				)}
			</ScrollView>
		</View>
	);
};

export default LeafletMap;

const styles = StyleSheet.create({
	container: { flex: 1 },
	logContainer: {
		maxHeight: 120,
		borderTopWidth: 1,
	},
	logEntry: {
		fontSize: 11,
		paddingHorizontal: 8,
		paddingVertical: 1,
	},
	logPlaceholder: {
		fontSize: 11,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
});
