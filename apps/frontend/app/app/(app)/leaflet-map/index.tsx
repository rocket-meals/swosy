import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { Keyboard, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MyMap from '@/components/MyMap/MyMap';
import { MARKER_DEFAULT_SIZE } from '@/components/MyMap/markerUtils';
import { LeafletWebViewEvent, MapLayer, MapMarker } from '@/components/MyMap/model';
import { useTheme } from '@/hooks/useTheme';
import { clusterMarkers } from '@/components/MyMap/clusterUtils';
import { DatabaseTypes } from 'repo-depkit-common';
import useBuildingDetailsModal from '@/hooks/useBuildingDetailsModal';
import SettingsList from '@/components/SettingsList/SettingsList';
import LeafletMapHeader from './components/LeafletMapHeader';
import DebugView from '@/components/DebugView';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';

type BuildingCoordinates = { coordinates?: [number, number] } | null;

type TileVariant = {
	key: string;
	label: string;
	layer: MapLayer;
};

const TILE_VARIANTS: TileVariant[] = [
	{
		key: 'osm',
		label: 'OpenStreetMap',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			baseLayerName: 'OpenStreetMap',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'otm',
		label: 'OpenTopoMap',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
			baseLayerName: 'OpenTopoMap',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'carto-light',
		label: 'CartoDB Light',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
			baseLayerName: 'CartoDB Light',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'carto-dark',
		label: 'CartoDB Dark',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
			baseLayerName: 'CartoDB Dark',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'osm-hot',
		label: 'OSM Humanitarian',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
			baseLayerName: 'OSM Humanitarian',
			baseLayerIsChecked: true,
		},
	},
];

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

const MAX_SEARCH_RESULTS = 3;

const LeafletMap = () => {
	useSetPageTitle(TranslationKeys.leaflet_map);

	const { buildings } = useAppSelector((state) => state.canteenReducer);
	const drawerPosition = useAppSelector((state) => state.settings.drawerPosition);
	const selectedCanteen = useSelectedCanteen();
	const { openBuildingDetailsModal } = useBuildingDetailsModal();
	const { theme } = useTheme();
	const { show, close } = useMyScrollViewModal();

	const [logEntries, setLogEntries] = useState<string[]>([]);
	const logScrollRef = useRef<ScrollView>(null);

	// Search state
	const [searchQuery, setSearchQuery] = useState('');

	// Selected tile layer (map material)
	const [selectedTileVariantKey, setSelectedTileVariantKey] = useState<string>(TILE_VARIANTS[0].key);

	// Fly animation toggle (false = jump/instant, true = fly/animated)
	// Stored as a preference; passed to MyMap so the map can use flyTo vs setView
	// (the Leaflet HTML needs to be updated to honour this flag)
	const [useFlyAnimation, setUseFlyAnimation] = useState(true);

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

	const selectedTileLayer = useMemo(
		() => (TILE_VARIANTS.find((v) => v.key === selectedTileVariantKey) ?? TILE_VARIANTS[0]).layer,
		[selectedTileVariantKey],
	);

	const openTileSelectorModal = useCallback(() => {
		show({
			title: 'Kartenmaterial',
			children: (
				<View>
					{TILE_VARIANTS.map((variant, index) => {
						const isSelected = variant.key === selectedTileVariantKey;
						const groupPosition =
							TILE_VARIANTS.length === 1
								? 'single'
								: index === 0
								? 'top'
								: index === TILE_VARIANTS.length - 1
								? 'bottom'
								: 'middle';
						return (
							<SettingsList
								key={variant.key}
								title={variant.label}
								rightIcon={
									isSelected ? (
										<MaterialCommunityIcons name="check" size={20} color={theme.screen.icon} />
									) : undefined
								}
								onPress={() => {
									setSelectedTileVariantKey(variant.key);
									close();
								}}
								showSeparator={index < TILE_VARIANTS.length - 1}
								groupPosition={groupPosition}
								noIconIndent
							/>
						);
					})}
				</View>
			),
		});
	}, [show, close, selectedTileVariantKey, theme]);

	const openSettingsModal = useCallback(() => {
		show({
			title: 'Karten Einstellungen',
			children: (
				<View style={settingsModalStyles.container}>
					<SettingsList
						title="Kartenmaterial"
						value={(TILE_VARIANTS.find((v) => v.key === selectedTileVariantKey) ?? TILE_VARIANTS[0]).label}
						rightIcon={<Entypo name="chevron-small-right" size={24} color={theme.screen.icon} />}
						onPress={openTileSelectorModal}
						groupPosition="top"
						noIconIndent
					/>
					<SettingsList
						title="Sanfte Kamera-Bewegung"
						rightElement={
							<Switch
								value={useFlyAnimation}
								onValueChange={setUseFlyAnimation}
							/>
						}
						groupPosition="bottom"
						showSeparator={false}
						noIconIndent
					/>
				</View>
			),
		});
	}, [show, openTileSelectorModal, selectedTileVariantKey, useFlyAnimation, theme]);

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

	// Search results: up to 3 buildings matching the query
	const searchResults = useMemo((): DatabaseTypes.Buildings[] => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		return (buildings as DatabaseTypes.Buildings[])
			.filter((b) => (b.alias ?? '').toLowerCase().includes(q))
			.slice(0, MAX_SEARCH_RESULTS);
	}, [buildings, searchQuery]);

	const handleSearchResultSelect = useCallback(
		(building: DatabaseTypes.Buildings) => {
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			if (coords && coords.length === 2) {
				setMapCenterOverride({ lat: Number(coords[1]), lng: Number(coords[0]) });
			}
			setSearchQuery('');
			Keyboard.dismiss();
		},
		[],
	);

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
		<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header.background }]}>
			<LeafletMapHeader
				drawerPosition={drawerPosition}
				query={searchQuery}
				onQueryChange={setSearchQuery}
				onSettingsPress={openSettingsModal}
			/>
			<View style={styles.contentArea}>
				<View style={styles.container}>
					<MyMap
						mapCenterPosition={mapCenterOverride ?? centerPosition}
						zoom={mapZoom}
						mapMarkers={buildingMarkers}
						mapLayers={[selectedTileLayer]}
						onMarkerClick={handleMarkerClick}
						onMapEvent={handleMapEvent}
					/>
					<DebugView showInDevMode title="Map Log">
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
					</DebugView>
				</View>
				{searchResults.length > 0 && (
					<View style={[styles.searchResultsContainer, { backgroundColor: theme.screen.background }]}>
						{searchResults.map((building, index) => (
							<SettingsList
								key={building.id ?? index}
								title={building.alias ?? ''}
								onPress={() => handleSearchResultSelect(building)}
								showSeparator={index < searchResults.length - 1}
								groupPosition={
									searchResults.length === 1
										? 'single'
										: index === 0
										? 'top'
										: index === searchResults.length - 1
										? 'bottom'
										: 'middle'
								}
								noIconIndent
							/>
						))}
					</View>
				)}
			</View>
		</SafeAreaView>
	);
};

export default LeafletMap;

const settingsModalStyles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
});

const styles = StyleSheet.create({
	safeArea: { flex: 1 },
	contentArea: { flex: 1, position: 'relative' },
	container: { flex: 1 },
	searchResultsContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		elevation: 10,
	},
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
