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
import { Entypo } from '@expo/vector-icons';
import SettingsListSelectOption from '@/components/SettingsListSelectOption/SettingsListSelectOption';
import { useDispatch } from 'react-redux';
import { SET_MAP_TILE_VARIANT_KEY, SET_MAP_USE_FLY_ANIMATION, SET_MAP_VIRTUAL_ZOOM } from '@/redux/Types/types';
import SettingsListOrganisationFast from '@/components/SettingsListOrganisationFast';
import { useLanguage } from '@/hooks/useLanguage';

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

type LeafletSettingsContentProps = {
	initialSelectedTileKey: string;
	initialUseFlyAnimation: boolean;
	initialUseVirtualZoom: boolean;
	onSelectedTileChange: (key: string) => void;
	onFlyAnimationChange: (value: boolean) => void;
	onVirtualZoomChange: (value: boolean) => void;
	theme: ReturnType<typeof useTheme>['theme'];
};

const LeafletSettingsContent: React.FC<LeafletSettingsContentProps> = ({
	initialSelectedTileKey,
	initialUseFlyAnimation,
	initialUseVirtualZoom,
	onSelectedTileChange,
	onFlyAnimationChange,
	onVirtualZoomChange,
	theme,
}) => {
	const [selectedTileKey, setSelectedTileKey] = useState(initialSelectedTileKey);
	const [localFlyAnimation, setLocalFlyAnimation] = useState(initialUseFlyAnimation);
	const [localVirtualZoom, setLocalVirtualZoom] = useState(initialUseVirtualZoom);
	const [showingTileSelector, setShowingTileSelector] = useState(false);

	if (showingTileSelector) {
		return (
			<SettingsListSelectOption
				options={TILE_VARIANTS.map((v) => ({ id: v.key, label: v.label }))}
				selectedOption={selectedTileKey}
				onSelect={(option) => {
					setSelectedTileKey(option.id);
					onSelectedTileChange(option.id);
					setShowingTileSelector(false);
				}}
				noIconIndent
			/>
		);
	}

	return (
		<>
			<SettingsList
				title="Kartenmaterial"
				value={(TILE_VARIANTS.find((v) => v.key === selectedTileKey) ?? TILE_VARIANTS[0]).label}
				rightIcon={<Entypo name="chevron-small-right" size={24} color={theme.screen.icon} />}
				onPress={() => setShowingTileSelector(true)}
				groupPosition="top"
				noIconIndent
			/>
			<SettingsList
				title="Sanfte Kamera-Bewegung"
				rightElement={
					<Switch
						value={localFlyAnimation}
						onValueChange={(value) => {
							setLocalFlyAnimation(value);
							onFlyAnimationChange(value);
						}}
					/>
				}
				groupPosition="middle"
				noIconIndent
			/>
			<SettingsList
				title="Virtueller Zoom (ab Zoom 17)"
				rightElement={
					<Switch
						value={localVirtualZoom}
						onValueChange={(value) => {
							setLocalVirtualZoom(value);
							onVirtualZoomChange(value);
						}}
					/>
				}
				groupPosition="bottom"
				showSeparator={false}
				noIconIndent
			/>
		</>
	);
};

type LeafletFilterContentProps = {
	organisations: DatabaseTypes.Organizations[];
	initialLikes: Record<string, boolean | null>;
	onLikeChange: (organisationId: string, like: boolean) => void;
};

const LeafletFilterContent: React.FC<LeafletFilterContentProps> = ({
	organisations,
	initialLikes,
	onLikeChange,
}) => {
	const [localLikes, setLocalLikes] = useState<Record<string, boolean | null>>(initialLikes);

	const handlePressLike = useCallback(
		(orgId: string) => {
			setLocalLikes((prev) => {
				const current = prev[orgId];
				const next = current === true ? null : true;
				if (next === null) {
					const { [orgId]: _, ...rest } = prev;
					return rest;
				}
				return { ...prev, [orgId]: next };
			});
			onLikeChange(orgId, true);
		},
		[onLikeChange]
	);

	const handlePressDislike = useCallback(
		(orgId: string) => {
			setLocalLikes((prev) => {
				const current = prev[orgId];
				const next = current === false ? null : false;
				if (next === null) {
					const { [orgId]: _, ...rest } = prev;
					return rest;
				}
				return { ...prev, [orgId]: next };
			});
			onLikeChange(orgId, false);
		},
		[onLikeChange]
	);

	if (organisations.length === 0) return null;

	return (
		<>
			{organisations.map((org, index) => {
				const total = organisations.length;
				const groupPosition =
					total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';
				return (
					<SettingsListOrganisationFast
						key={org.id}
						organisationId={org.id}
						like={localLikes[org.id] ?? null}
						onPressLike={handlePressLike}
						onPressDislike={handlePressDislike}
						groupPosition={groupPosition}
					/>
				);
			})}
		</>
	);
};

const POSITION_BUNDESTAG = {
	lat: 52.518594247456804,
	lng: 13.376281624711964,
};

const MAX_LOG_ENTRIES = 50;

const MAX_ZOOM = 20;
const DEFAULT_ZOOM = 17;
const VIRTUAL_ZOOM_MAX_NATIVE_ZOOM = 17;

const BUILDING_MARKER_SIZE = MARKER_DEFAULT_SIZE;
const BUILDING_MARKER_COLOR = '#1565c0';
const MAX_BUILDING_LABEL_CHARS = 3;

function createBuildingMarkerSvg(
	externalIdentifier?: string | null,
	markerColor?: string | null,
	markerLabel?: string | null,
	markerLabelColor?: string | null,
): string {
	const size = BUILDING_MARKER_SIZE;
	const cx = size / 2;
	const cy = size / 2;
	const r = cx - 2;
	const fillColor = markerColor ?? BUILDING_MARKER_COLOR;
	const textColor = markerLabelColor ?? 'white';
	const rawLabel = markerLabel ?? externalIdentifier;
	const label = rawLabel ? rawLabel.slice(0, MAX_BUILDING_LABEL_CHARS) : null;
	const circleEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="white" stroke-width="2" opacity="0.9"/>`;
	const textEl = label
		? `<text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="${textColor}" font-family="Arial,sans-serif" font-size="12" font-weight="bold">${label}</text>`
		: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${circleEl}${textEl}</svg>`;
}

const MAX_SEARCH_RESULTS = 3;

const LeafletMap = () => {
	useSetPageTitle(TranslationKeys.leaflet_map);

	const { buildings, organisations } = useAppSelector((state) => state.canteenReducer);
	const drawerPosition = useAppSelector((state) => state.settings.drawerPosition);
	const selectedTileVariantKey = useAppSelector((state) => state.settings.mapTileVariantKey);
	const useFlyAnimation = useAppSelector((state) => state.settings.mapUseFlyAnimation);
	const useVirtualZoom = useAppSelector((state) => state.settings.mapVirtualZoom);
	const dispatch = useDispatch();
	const selectedCanteen = useSelectedCanteen();
	const { openBuildingDetailsModal } = useBuildingDetailsModal();
	const { theme } = useTheme();
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const [logEntries, setLogEntries] = useState<string[]>([]);
	const logScrollRef = useRef<ScrollView>(null);

	// Search state
	const [searchQuery, setSearchQuery] = useState('');

	// Organisation filter state: orgId → true (liked) | false (disliked) | null (neutral)
	const [organisationLikes, setOrganisationLikes] = useState<Record<string, boolean | null>>({});
	// Ref so the stable modal callback always reads the latest handler
	const handleOrganisationLikeChangeRef = useRef<(orgId: string, like: boolean) => void>(() => {});

	const handleOrganisationLikeChange = useCallback((orgId: string, like: boolean) => {
		setOrganisationLikes((prev) => {
			const current = prev[orgId];
			const next = current === like ? null : like;
			if (next === null) {
				const { [orgId]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [orgId]: next };
		});
	}, []);

	// Keep ref up to date so the modal callback is never stale
	handleOrganisationLikeChangeRef.current = handleOrganisationLikeChange;

	// Stable callback passed to modal – delegates via ref to avoid stale closures
	const stableOnOrganisationLikeChange = useCallback((orgId: string, like: boolean) => {
		handleOrganisationLikeChangeRef.current(orgId, like);
	}, []);

	const setSelectedTileVariantKey = useCallback((key: string) => {
		dispatch({ type: SET_MAP_TILE_VARIANT_KEY, payload: key });
	}, [dispatch]);

	const setUseFlyAnimation = useCallback((value: boolean) => {
		dispatch({ type: SET_MAP_USE_FLY_ANIMATION, payload: value });
	}, [dispatch]);

	const setUseVirtualZoom = useCallback((value: boolean) => {
		dispatch({ type: SET_MAP_VIRTUAL_ZOOM, payload: value });
	}, [dispatch]);

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

	const selectedTileLayer = useMemo(() => {
		const layer = (TILE_VARIANTS.find((v) => v.key === selectedTileVariantKey) ?? TILE_VARIANTS[0]).layer;
		if (useVirtualZoom) {
			return { ...layer, maxNativeZoom: VIRTUAL_ZOOM_MAX_NATIVE_ZOOM, maxZoom: MAX_ZOOM };
		}
		return layer;
	}, [selectedTileVariantKey, useVirtualZoom]);

	const openSettingsModal = useCallback(() => {
		show({
			title: 'Karten Einstellungen',
			children: (
				<LeafletSettingsContent
					initialSelectedTileKey={selectedTileVariantKey}
					initialUseFlyAnimation={useFlyAnimation}
					initialUseVirtualZoom={useVirtualZoom}
					onSelectedTileChange={setSelectedTileVariantKey}
					onFlyAnimationChange={setUseFlyAnimation}
					onVirtualZoomChange={setUseVirtualZoom}
					theme={theme}
				/>
			),
		});
	}, [show, selectedTileVariantKey, useFlyAnimation, useVirtualZoom, theme]);

	const openFilterModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.organisations),
			children: (
				<LeafletFilterContent
					organisations={organisations as DatabaseTypes.Organizations[]}
					initialLikes={organisationLikes}
					onLikeChange={stableOnOrganisationLikeChange}
				/>
			),
		});
	}, [show, translate, organisations, organisationLikes, stableOnOrganisationLikeChange]);

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

	// IDs of organisations the user has liked
	const likedOrganisationIds = useMemo(
		() =>
			Object.entries(organisationLikes)
				.filter(([, v]) => v === true)
				.map(([k]) => k),
		[organisationLikes]
	);

	// Build markers for all buildings that have valid coordinates,
	// filtered by liked organisations when any are selected.
	const buildingMarkers = useMemo((): MapMarker[] => {
		return (buildings as DatabaseTypes.Buildings[])
			.filter((building) => {
				const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
				if (!coords || coords.length !== 2) return false;
				// Apply organisation filter only when at least one org is liked
				if (likedOrganisationIds.length > 0) {
					const buildingAny = building as any;
					// Support both a single organisation_id and a many-to-many organisations array
					const orgId: string | undefined =
						buildingAny.organisation_id ?? buildingAny.organisation ?? null;
					const orgIds: string[] = Array.isArray(buildingAny.organisations)
						? buildingAny.organisations.map((o: any) =>
								typeof o === 'string' ? o : o?.organisations_id ?? o?.id
							)
						: orgId
						? [orgId]
						: [];
					if (orgIds.length === 0) return true; // no org link → always show
					return orgIds.some((id) => likedOrganisationIds.includes(id));
				}
				return true;
			})
			.map((building) => {
				const coords = (building.coordinates as BuildingCoordinates)!.coordinates!;
				const [lng, lat] = coords;
				return {
					id: `building-${building.id}`,
					position: { lat: Number(lat), lng: Number(lng) },
					icon: createBuildingMarkerSvg(
						building.external_identifier,
						building.map_marker_color,
						building.map_marker_label,
						building.map_marker_label_color,
					),
					size: [BUILDING_MARKER_SIZE, BUILDING_MARKER_SIZE] as [number, number],
					iconAnchor: [BUILDING_MARKER_SIZE / 2, BUILDING_MARKER_SIZE / 2] as [number, number],
				};
			});
	}, [buildings, likedOrganisationIds]);

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

			if (coords && coords.length === 2) {
				setMapCenterOverride({ lat: Number(coords[1]), lng: Number(coords[0]) });
				setMapZoom(DEFAULT_ZOOM);
			}

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
				onFilterPress={openFilterModal}
			/>
			<View style={styles.contentArea}>
				<View style={styles.container}>
					<MyMap
						key={`${selectedTileVariantKey}-${useVirtualZoom}`}
						mapCenterPosition={mapCenterOverride ?? centerPosition}
						zoom={mapZoom}
						mapMarkers={buildingMarkers}
						mapLayers={[selectedTileLayer]}
						useFlyAnimation={useFlyAnimation}
						onMarkerClick={handleMarkerClick}
						onMapEvent={handleMapEvent}
					/>
					<DebugView title="Map Log">
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
