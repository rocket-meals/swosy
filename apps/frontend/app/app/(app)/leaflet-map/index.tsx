import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { Alert, Keyboard, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MyMap from '@/components/MyMap/MyMap';
import { MARKER_DEFAULT_SIZE, createUserLocationMarkerSvg, getMarkerLabelFromBuildingAlias } from '@/components/MyMap/markerUtils';
import { LeafletWebViewEvent, MapLayer, MapMarker } from '@/components/MyMap/model';
import { useTheme } from '@/hooks/useTheme';
import { clusterMarkers } from '@/components/MyMap/clusterUtils';
import { VIRTUAL_ZOOM_NONE_KEY, VIRTUAL_ZOOM_OPTIONS } from '@/components/MyMap/mapSettingsUtils';
import { DatabaseTypes } from 'repo-depkit-common';
import useBuildingDetailsModal from '@/hooks/useBuildingDetailsModal';
import SettingsList from '@/components/SettingsList/SettingsList';
import SettingsListBoolean from '@/components/SettingsListBoolean/SettingsListBoolean';
import LeafletMapHeader from './components/LeafletMapHeader';
import DebugView from '@/components/DebugView';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { Entypo, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import SettingsListSelectOption from '@/components/SettingsListSelectOption/SettingsListSelectOption';
import { useDispatch } from 'react-redux';
import { SET_MAP_CLUSTER_PIXEL_RADIUS, SET_MAP_ORGANISATION_FILTER, SET_MAP_SHOW_BUILDING_MARKERS, SET_MAP_SHOW_CLUSTERS, SET_MAP_SHOW_MARKER_LABELS, SET_MAP_TILE_VARIANT_KEY, SET_MAP_USE_FLY_ANIMATION, SET_MAP_VIRTUAL_ZOOM } from '@/redux/Types/types';
import SettingsListOrganisationFast from '@/components/SettingsListOrganisationFast';
import { useLanguage } from '@/hooks/useLanguage';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import * as Location from 'expo-location';

type BuildingCoordinates = { coordinates?: [number, number] } | null;

type TileVariant = {
	key: string;
	label: string;
	layer: MapLayer;
	defaultVirtualZoom: number;
};

const TILE_VARIANTS: TileVariant[] = [
	{
		key: 'osm',
		label: 'OpenStreetMap',
		defaultVirtualZoom: 18,
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
		defaultVirtualZoom: 17,
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
		defaultVirtualZoom: 18,
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
		defaultVirtualZoom: 18,
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
		defaultVirtualZoom: 18,
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
	initialUseVirtualZoom: number | null;
	initialClusterPixelRadius: number;
	initialShowBuildingMarkers: boolean;
	initialShowClusters: boolean;
	initialShowMarkerLabels: boolean;
	onSelectedTileChange: (key: string) => void;
	onFlyAnimationChange: (value: boolean) => void;
	onVirtualZoomChange: (value: number | null) => void;
	onClusterPixelRadiusChange: (value: number) => void;
	onShowBuildingMarkersChange: (value: boolean) => void;
	onShowClustersChange: (value: boolean) => void;
	onShowMarkerLabelsChange: (value: boolean) => void;
	onOpenDisplaySettings: () => void;
	theme: ReturnType<typeof useTheme>['theme'];
};

const LeafletSettingsContent: React.FC<LeafletSettingsContentProps> = ({
	initialSelectedTileKey,
	initialUseFlyAnimation,
	initialUseVirtualZoom,
	initialClusterPixelRadius,
	initialShowBuildingMarkers,
	initialShowClusters,
	initialShowMarkerLabels,
	onSelectedTileChange,
	onFlyAnimationChange,
	onVirtualZoomChange,
	onClusterPixelRadiusChange,
	onShowBuildingMarkersChange,
	onShowClustersChange,
	onShowMarkerLabelsChange,
	onOpenDisplaySettings,
	theme,
}) => {
	const [selectedTileKey, setSelectedTileKey] = useState(initialSelectedTileKey);
	const [localFlyAnimation, setLocalFlyAnimation] = useState(initialUseFlyAnimation);
	const [localVirtualZoom, setLocalVirtualZoom] = useState<number | null>(initialUseVirtualZoom);
	const [localClusterPixelRadius, setLocalClusterPixelRadius] = useState(String(initialClusterPixelRadius));
	const [showingTileSelector, setShowingTileSelector] = useState(false);
	const [showingVirtualZoomSelector, setShowingVirtualZoomSelector] = useState(false);

	if (showingTileSelector) {
		return (
			<SettingsListSelectOption
				options={TILE_VARIANTS.map((v) => ({ id: v.key, label: v.label }))}
				selectedOption={selectedTileKey}
				onSelect={(option) => {
					const variant = TILE_VARIANTS.find((v) => v.key === option.id) ?? TILE_VARIANTS[0];
					setSelectedTileKey(option.id);
					onSelectedTileChange(option.id);
					setLocalVirtualZoom(variant.defaultVirtualZoom);
					onVirtualZoomChange(variant.defaultVirtualZoom);
					setShowingTileSelector(false);
				}}
				noIconIndent
			/>
		);
	}

	if (showingVirtualZoomSelector) {
		return (
			<SettingsListSelectOption
				options={VIRTUAL_ZOOM_OPTIONS}
				selectedOption={localVirtualZoom === null ? VIRTUAL_ZOOM_NONE_KEY : String(localVirtualZoom)}
				onSelect={(option) => {
					const value = option.id === VIRTUAL_ZOOM_NONE_KEY ? null : Number(option.id);
					setLocalVirtualZoom(value);
					onVirtualZoomChange(value);
					setShowingVirtualZoomSelector(false);
				}}
				noIconIndent
			/>
		);
	}

	const virtualZoomLabel =
		localVirtualZoom === null
			? 'Kein Virtueller Zoom'
			: String(localVirtualZoom);

	return (
		<>
			<SettingsList
				title="Kartenmaterial"
				value={(TILE_VARIANTS.find((v) => v.key === selectedTileKey) ?? TILE_VARIANTS[0]).label}
				leftIcon={<MaterialIcons name="layers" size={20} color={theme.screen.icon} />}
				rightIcon={<Entypo name="chevron-small-right" size={24} color={theme.screen.icon} />}
				onPress={() => setShowingTileSelector(true)}
				groupPosition="top"
			/>
			<SettingsList
				title="Cluster-Abstand (px)"
				leftIcon={<MaterialCommunityIcons name="dots-grid" size={20} color={theme.screen.icon} />}
				rightElement={
					<TextInput
						value={localClusterPixelRadius}
						onChangeText={(text) => {
							setLocalClusterPixelRadius(text);
							const num = parseInt(text, 10);
							if (!isNaN(num) && num >= MIN_CLUSTER_PIXEL_RADIUS) {
								onClusterPixelRadiusChange(num);
							}
						}}
						keyboardType="numeric"
						style={{ color: theme.screen.text, textAlign: 'right', minWidth: 60, fontSize: 15 }}
					/>
				}
				groupPosition="middle"
			/>
			<SettingsList
				title="Sanfte Kamera-Bewegung"
				leftIcon={<MaterialIcons name="animation" size={20} color={theme.screen.icon} />}
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
			/>
			<SettingsList
				title="Virtueller Zoom"
				value={virtualZoomLabel}
				leftIcon={<MaterialIcons name="zoom-in" size={20} color={theme.screen.icon} />}
				rightIcon={<Entypo name="chevron-small-right" size={24} color={theme.screen.icon} />}
				onPress={() => setShowingVirtualZoomSelector(true)}
				groupPosition="middle"
			/>
			<SettingsList
				title="Anzeige"
				leftIcon={<MaterialIcons name="visibility" size={20} color={theme.screen.icon} />}
				rightIcon={<Entypo name="chevron-small-right" size={24} color={theme.screen.icon} />}
				onPress={onOpenDisplaySettings}
				groupPosition="bottom"
				showSeparator={false}
			/>
		</>
	);
};

type LeafletFilterContentProps = {
	organisations: DatabaseTypes.Organizations[];
	initialLikes: Record<string, boolean | null>;
	onLikeChange: (organisationId: string, like: boolean) => void;
	onResetAll: () => void;
};

const LeafletFilterContent: React.FC<LeafletFilterContentProps> = ({
	organisations,
	initialLikes,
	onLikeChange,
	onResetAll,
}) => {
	const [localLikes, setLocalLikes] = useState<Record<string, boolean | null>>(initialLikes);
	const { translate } = useLanguage();

	// Sync local state if initialLikes reference changes (e.g. modal re-renders with updated parent state)
	useEffect(() => {
		setLocalLikes(initialLikes);
	}, [initialLikes]);

	const handlePressLike = useCallback(
		(orgId: string) => {
			setLocalLikes((prev) => {
				const current = prev[orgId];
				const next = current === true ? null : true;
				if (next === null) {
					const updated = { ...prev };
					delete updated[orgId];
					return updated;
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
					const updated = { ...prev };
					delete updated[orgId];
					return updated;
				}
				return { ...prev, [orgId]: next };
			});
			onLikeChange(orgId, false);
		},
		[onLikeChange]
	);

	const handleResetAll = useCallback(() => {
		setLocalLikes({});
		onResetAll();
	}, [onResetAll]);

	if (organisations.length === 0) {
		return (
			<View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
				<Text style={{ color: '#888' }}>{translate(TranslationKeys.no_data_found)}</Text>
			</View>
		);
	}

	return (
		<>
			<SettingsList
				label={translate(TranslationKeys.reset_rating)}
				handleFunction={handleResetAll}
				groupPosition="single"
				noIconIndent
			/>
			<View style={{ height: 16 }} />
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

type LeafletDisplaySettingsContentProps = {
	showBuildingMarkers: boolean;
	showClusters: boolean;
	showMarkerLabels: boolean;
	onShowBuildingMarkersChange: (value: boolean) => void;
	onShowClustersChange: (value: boolean) => void;
	onShowMarkerLabelsChange: (value: boolean) => void;
};

const LeafletDisplaySettingsContent: React.FC<LeafletDisplaySettingsContentProps> = ({
	showBuildingMarkers,
	showClusters,
	showMarkerLabels,
	onShowBuildingMarkersChange,
	onShowClustersChange,
	onShowMarkerLabelsChange,
}) => {
	return (
		<>
			<SettingsListBoolean
				title="Gebäude-Marker anzeigen"
				leftIcon={<MaterialIcons name="place" size={20} />}
				isEnabled={showBuildingMarkers}
				onToggle={() => onShowBuildingMarkersChange(!showBuildingMarkers)}
				groupPosition="top"
			/>
			<SettingsListBoolean
				title="Cluster anzeigen"
				leftIcon={<MaterialCommunityIcons name="dots-grid" size={20} />}
				isEnabled={showClusters}
				onToggle={() => onShowClustersChange(!showClusters)}
				groupPosition="middle"
			/>
			<SettingsListBoolean
				title="Marker-Beschriftung anzeigen"
				leftIcon={<MaterialIcons name="label" size={20} />}
				isEnabled={showMarkerLabels}
				onToggle={() => onShowMarkerLabelsChange(!showMarkerLabels)}
				groupPosition="bottom"
				showSeparator={false}
			/>
		</>
	);
};

const POSITION_BUNDESTAG = {
	lat: 52.518594247456804,
	lng: 13.376281624711964,
};

const MAX_LOG_ENTRIES = 200;

const MAX_ZOOM = 20;
const DEFAULT_ZOOM = 17;

const BUILDING_MARKER_SIZE = MARKER_DEFAULT_SIZE;
const BUILDING_MARKER_COLOR = '#1565c0';
const MAX_BUILDING_LABEL_CHARS = 8;
// Minimum cluster pixel radius – values below this would create excessively tight clusters
const MIN_CLUSTER_PIXEL_RADIUS = 10;

/** Returns black or white based on the luminance of the given hex background color. */
function getContrastColor(hexColor: string): string {
	const hex = hexColor.replace('#', '');
	if (hex.length !== 6) return '#ffffff';
	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;
	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	// WCAG relative-luminance midpoint: colours above this threshold are considered "light"
	const WCAG_LIGHT_THRESHOLD = 0.179;
	return luminance > WCAG_LIGHT_THRESHOLD ? '#000000' : '#ffffff';
}

/**
 * Returns the first organisation linked to the building from the pre-computed dict, or null if none.
 */
function getFirstOrganisationFromDict(
	buildingId: string,
	buildingIdToOrgsDict: Record<string, DatabaseTypes.Organizations[]>
): DatabaseTypes.Organizations | null {
	const orgs = buildingIdToOrgsDict[buildingId];
	return orgs && orgs.length > 0 ? orgs[0] : null;
}

/**
 * Creates an SVG circle marker for a building.
 *
 * Colour fallback priority (per field):
 *   1. Building's own `markerColor` / `markerLabelColor`
 *   2. First organisation's `orgMarkerColor` / `orgMarkerLabelColor`
 *   3. Project default: `fallbackColor` (project colour) / `fallbackLabelColor` (contrast of project colour)
 *
 * Label fallback priority:
 *   1. Explicit `markerLabel`
 *   2. `externalIdentifier`
 *   3. Derived from `alias` via `getMarkerLabelFromBuildingAlias`
 */
function createBuildingMarkerSvg(
	externalIdentifier?: string | null,
	markerColor?: string | null,
	markerLabel?: string | null,
	markerLabelColor?: string | null,
	orgMarkerColor?: string | null,
	orgMarkerLabelColor?: string | null,
	fallbackColor?: string | null,
	fallbackLabelColor?: string | null,
	alias?: string | null,
	showLabel?: boolean,
): string {
	const size = BUILDING_MARKER_SIZE;
	const cx = size / 2;
	const cy = size / 2;
	const r = cx - 2;
	// Use || instead of ?? so that empty strings also fall back to the next value in the chain
	const fillColor = markerColor || orgMarkerColor || fallbackColor || BUILDING_MARKER_COLOR;
	const textColor = markerLabelColor || orgMarkerLabelColor || fallbackLabelColor || 'white';
	let rawLabel: string | null = markerLabel || externalIdentifier || null;
	if (!rawLabel && alias) {
		rawLabel = getMarkerLabelFromBuildingAlias(alias);
	}
	const label = (showLabel !== false && rawLabel) ? rawLabel.slice(0, MAX_BUILDING_LABEL_CHARS) : null;
	const circleEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="white" stroke-width="2" opacity="0.9"/>`;
	let textEl = '';
	if (label) {
		if (label.length >= 4) {
			const mid = Math.ceil(label.length / 2);
			const line1 = label.slice(0, mid);
			const line2 = label.slice(mid);
			textEl = `<text text-anchor="middle" fill="${textColor}" font-family="Arial,sans-serif" font-size="10" font-weight="bold">` +
				`<tspan x="${cx}" dy="${cy - 6}">${line1}</tspan>` +
				`<tspan x="${cx}" dy="13">${line2}</tspan>` +
				`</text>`;
		} else {
			textEl = `<text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="${textColor}" font-family="Arial,sans-serif" font-size="12" font-weight="bold">${label}</text>`;
		}
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${circleEl}${textEl}</svg>`;
}

const MAX_SEARCH_RESULTS = 3;

const LeafletMap = () => {
	useSetPageTitle(TranslationKeys.leaflet_map);

	const { buildings, buildingsOrganizations, organisations } = useAppSelector((state) => state.canteenReducer);
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);
	const drawerPosition = useAppSelector((state) => state.settings.drawerPosition);
	const selectedTileVariantKey = useAppSelector((state) => state.settings.mapTileVariantKey);
	const useFlyAnimation = useAppSelector((state) => state.settings.mapUseFlyAnimation);
	const useVirtualZoom = useAppSelector((state) => state.settings.mapVirtualZoom);
	const clusterPixelRadius = useAppSelector((state) => state.settings.mapClusterPixelRadius ?? 60);
	const organisationLikes = useAppSelector((state) => state.settings.mapOrganisationFilter ?? {}) as Record<string, boolean | null>;
	const showBuildingMarkers = useAppSelector((state) => (state.settings as any).mapShowBuildingMarkers ?? true) as boolean;
	const showClusters = useAppSelector((state) => (state.settings as any).mapShowClusters ?? true) as boolean;
	const showMarkerLabels = useAppSelector((state) => (state.settings as any).mapShowMarkerLabels ?? true) as boolean;
	const dispatch = useDispatch();
	const selectedCanteen = useSelectedCanteen();
	const { openBuildingDetailsModal } = useBuildingDetailsModal();
	const { theme } = useTheme();
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const [logEntries, setLogEntries] = useState<string[]>([]);
	const logScrollRef = useRef<ScrollView>(null);

	// User location state
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

	// Fast lookup dict for organisations – keyed by organisation ID
	const organisationsDict = useMemo(
		() => (organisations as DatabaseTypes.Organizations[]).reduce<Record<string, DatabaseTypes.Organizations>>(
			(acc, org) => { acc[org.id] = org; return acc; },
			{}
		),
		[organisations]
	);

	// Dict: buildingId → Organizations[] derived from the buildings_organizations join table
	const buildingIdToOrgsDict = useMemo(
		() => BuildingsHelper.getBuildingIdToOrganizationsDict(
			buildingsOrganizations,
			organisationsDict
		),
		[buildingsOrganizations, organisationsDict]
	);

	// Contrast label colour to use as the default marker text colour when no explicit colour is set
	const primaryColorContrastColor = useMemo(() => getContrastColor(primaryColor), [primaryColor]);

	// Search state
	const [searchQuery, setSearchQuery] = useState('');

	// Organisation filter is persisted in Redux: orgId → true (liked) | false (disliked); absent key = neutral
	// Ref so the stable modal callback always reads the latest handler
	const handleOrganisationLikeChangeRef = useRef<(orgId: string, like: boolean) => void>(() => {});

	const handleOrganisationLikeChange = useCallback((orgId: string, like: boolean) => {
		const current = organisationLikes[orgId];
		const next = current === like ? null : like;
		const updated = { ...organisationLikes };
		if (next === null) {
			delete updated[orgId];
		} else {
			updated[orgId] = next;
		}
		dispatch({ type: SET_MAP_ORGANISATION_FILTER, payload: updated });
	}, [dispatch, organisationLikes]);

	// Keep ref up to date so the modal callback is never stale
	handleOrganisationLikeChangeRef.current = handleOrganisationLikeChange;

	// Stable callback passed to modal – delegates via ref to avoid stale closures
	const stableOnOrganisationLikeChange = useCallback((orgId: string, like: boolean) => {
		handleOrganisationLikeChangeRef.current(orgId, like);
	}, []);

	const handleResetAllFiltersRef = useRef<() => void>(() => {});

	const handleResetAllFilters = useCallback(() => {
		dispatch({ type: SET_MAP_ORGANISATION_FILTER, payload: {} });
	}, [dispatch]);

	handleResetAllFiltersRef.current = handleResetAllFilters;

	const stableOnResetAllFilters = useCallback(() => {
		handleResetAllFiltersRef.current();
	}, []);

	const setSelectedTileVariantKey = useCallback((key: string) => {
		dispatch({ type: SET_MAP_TILE_VARIANT_KEY, payload: key });
	}, [dispatch]);

	const setUseFlyAnimation = useCallback((value: boolean) => {
		dispatch({ type: SET_MAP_USE_FLY_ANIMATION, payload: value });
	}, [dispatch]);

	const setUseVirtualZoom = useCallback((value: number | null) => {
		dispatch({ type: SET_MAP_VIRTUAL_ZOOM, payload: value });
	}, [dispatch]);

	const setClusterPixelRadius = useCallback((value: number) => {
		dispatch({ type: SET_MAP_CLUSTER_PIXEL_RADIUS, payload: value });
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

	// Log organisationsDict whenever it changes (init + updates)
	useEffect(() => {
		const entries = Object.entries(organisationsDict);
		addLog(
			`organisationsDict (${entries.length}): ` +
			(entries.length > 0
				? entries.map(([id, org]) => `${id}=${org.alias ?? 'n/a'}`).join(', ')
				: '(empty)')
		);
	}, [organisationsDict, addLog]);

	// Log buildingIdToOrgsDict whenever it changes (init + updates)
	useEffect(() => {
		const entries = Object.entries(buildingIdToOrgsDict);
		addLog(
			`buildingIdToOrgsDict (${entries.length} buildings): ` +
			(entries.length > 0
				? entries.map(([bid, orgs]) => `${bid}→[${orgs.map((o) => o.id).join(',')}]`).join(', ')
				: '(empty)')
		);
	}, [buildingIdToOrgsDict, addLog]);

	// Log per-marker color resolution to the DebugView whenever the relevant data changes
	useEffect(() => {
		const buildingsWithCoords = (buildings as DatabaseTypes.Buildings[]).filter((building) => {
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			return coords && coords.length === 2;
		});
		if (buildingsWithCoords.length === 0) return;
		addLog(`--- Marker colors (${buildingsWithCoords.length}) ---`);
		buildingsWithCoords.forEach((building) => {
			const firstOrg = getFirstOrganisationFromDict(building.id, buildingIdToOrgsDict);
			const resolvedColor =
				building.map_marker_color ||
				firstOrg?.map_marker_color ||
				primaryColor ||
				BUILDING_MARKER_COLOR;
			const colorSource = building.map_marker_color
				? 'building'
				: firstOrg?.map_marker_color
				? `org(${firstOrg.alias ?? firstOrg.id})`
				: primaryColor
				? 'primary'
				: 'default';
			const rawLabel = building.map_marker_label ?? building.external_identifier;
			const label = rawLabel ? rawLabel.slice(0, MAX_BUILDING_LABEL_CHARS) : null;
			const displayName = building.alias ?? rawLabel ?? building.id;
			addLog(`  ${displayName} | lbl=${label ?? '-'} | color=${resolvedColor} [${colorSource}]`);
		});
	}, [buildings, buildingIdToOrgsDict, primaryColor, addLog]);

	const selectedTileLayer = useMemo(() => {
		const layer = (TILE_VARIANTS.find((v) => v.key === selectedTileVariantKey) ?? TILE_VARIANTS[0]).layer;
		if (useVirtualZoom !== null) {
			return { ...layer, maxNativeZoom: useVirtualZoom, maxZoom: MAX_ZOOM };
		}
		return layer;
	}, [selectedTileVariantKey, useVirtualZoom]);

	const openDisplaySettingsModal = useCallback(() => {
		show({
			title: 'Anzeige',
			children: (
				<LeafletDisplaySettingsContent
					showBuildingMarkers={showBuildingMarkers}
					showClusters={showClusters}
					showMarkerLabels={showMarkerLabels}
					onShowBuildingMarkersChange={(v) => dispatch({ type: SET_MAP_SHOW_BUILDING_MARKERS, payload: v })}
					onShowClustersChange={(v) => dispatch({ type: SET_MAP_SHOW_CLUSTERS, payload: v })}
					onShowMarkerLabelsChange={(v) => dispatch({ type: SET_MAP_SHOW_MARKER_LABELS, payload: v })}
				/>
			),
		});
	}, [show, showBuildingMarkers, showClusters, showMarkerLabels, dispatch]);

	const openSettingsModal = useCallback(() => {
		show({
			title: 'Karten Einstellungen',
			children: (
				<LeafletSettingsContent
					initialSelectedTileKey={selectedTileVariantKey}
					initialUseFlyAnimation={useFlyAnimation}
					initialUseVirtualZoom={useVirtualZoom}
					initialClusterPixelRadius={clusterPixelRadius}
					initialShowBuildingMarkers={showBuildingMarkers}
					initialShowClusters={showClusters}
					initialShowMarkerLabels={showMarkerLabels}
					onSelectedTileChange={setSelectedTileVariantKey}
					onFlyAnimationChange={setUseFlyAnimation}
					onVirtualZoomChange={setUseVirtualZoom}
					onClusterPixelRadiusChange={setClusterPixelRadius}
					onShowBuildingMarkersChange={(v) => dispatch({ type: SET_MAP_SHOW_BUILDING_MARKERS, payload: v })}
					onShowClustersChange={(v) => dispatch({ type: SET_MAP_SHOW_CLUSTERS, payload: v })}
					onShowMarkerLabelsChange={(v) => dispatch({ type: SET_MAP_SHOW_MARKER_LABELS, payload: v })}
					onOpenDisplaySettings={openDisplaySettingsModal}
					theme={theme}
				/>
			),
		});
	}, [show, selectedTileVariantKey, useFlyAnimation, useVirtualZoom, clusterPixelRadius, showBuildingMarkers, showClusters, showMarkerLabels, theme, openDisplaySettingsModal]);

	const openFilterModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.organisations),
			children: (
				<LeafletFilterContent
					organisations={organisations as DatabaseTypes.Organizations[]}
					initialLikes={organisationLikes}
					onLikeChange={stableOnOrganisationLikeChange}
					onResetAll={stableOnResetAllFilters}
				/>
			),
		});
	}, [show, translate, organisations, organisationLikes, stableOnOrganisationLikeChange, stableOnResetAllFilters]);

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

	// IDs of organisations the user has disliked
	const dislikedOrganisationIds = useMemo(
		() =>
			Object.entries(organisationLikes)
				.filter(([, v]) => v === false)
				.map(([k]) => k),
		[organisationLikes]
	);

	// Build markers for all buildings that have valid coordinates,
	// filtered by liked/disliked organisations when any are selected.
	const buildingMarkers = useMemo((): MapMarker[] => {
		return (buildings as DatabaseTypes.Buildings[])
			.filter((building) => {
				const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
				if (!coords || coords.length !== 2) return false;
				const orgIds = (buildingIdToOrgsDict[building.id] ?? []).map((org) => org.id);
				// Apply positive filter: show only buildings with at least one liked org
				if (likedOrganisationIds.length > 0) {
					// Buildings with no organisation link bypass the positive filter and are always shown
					if (orgIds.length === 0) return true;
					if (!orgIds.some((id) => likedOrganisationIds.includes(id))) return false;
				}
				// Apply negative filter: hide buildings where ALL orgs are disliked
				if (dislikedOrganisationIds.length > 0 && orgIds.length > 0) {
					const nonDislikedOrgIds = orgIds.filter((id) => !dislikedOrganisationIds.includes(id));
					if (nonDislikedOrgIds.length === 0) return false;
				}
				return true;
			})
			.map((building) => {
				const coords = (building.coordinates as BuildingCoordinates)!.coordinates!;
				const [lng, lat] = coords;
				// Resolve the first linked organisation for style fallback
				const firstOrg = getFirstOrganisationFromDict(building.id, buildingIdToOrgsDict);
				const resolvedColor = building.map_marker_color || firstOrg?.map_marker_color || primaryColor || BUILDING_MARKER_COLOR;
				console.log('[LeafletMap] Building marker:', {
					id: building.id,
					alias: building.alias,
					buildingColor: building.map_marker_color,
					firstOrgId: firstOrg?.id,
					orgColor: firstOrg?.map_marker_color,
					resolvedColor,
				});
				return {
					id: `building-${building.id}`,
					position: { lat: Number(lat), lng: Number(lng) },
					icon: createBuildingMarkerSvg(
						building.external_identifier,
						building.map_marker_color,
						building.map_marker_label,
						building.map_marker_label_color,
						firstOrg?.map_marker_color ?? null,
						firstOrg?.map_marker_label_color ?? null,
						primaryColor,
						primaryColorContrastColor,
						building.alias,
						showMarkerLabels,
					),
					size: [BUILDING_MARKER_SIZE, BUILDING_MARKER_SIZE] as [number, number],
					iconAnchor: [BUILDING_MARKER_SIZE / 2, BUILDING_MARKER_SIZE / 2] as [number, number],
				};
			});
	}, [buildings, buildingIdToOrgsDict, likedOrganisationIds, dislikedOrganisationIds, primaryColor, primaryColorContrastColor, showMarkerLabels]);

	// Reset the centre override when the selected canteen changes so the map
	// returns to the canteen's building position.
	useEffect(() => {
		setMapCenterOverride(null);
	}, [centerPosition]);

	// Effective building markers: empty if showBuildingMarkers is disabled
	const effectiveBuildingMarkers = useMemo(
		() => showBuildingMarkers ? buildingMarkers : [],
		[buildingMarkers, showBuildingMarkers]
	);

	// Effective cluster radius: 0 disables clustering when showClusters is false
	const effectiveClusterPixelRadius = showClusters ? clusterPixelRadius : 0;

	// Pre-computed clustered markers at the current zoom – reused for cluster click handling
	const clusteredBuildingMarkers = useMemo(() => clusterMarkers(effectiveBuildingMarkers, mapZoom, effectiveClusterPixelRadius), [effectiveBuildingMarkers, mapZoom, effectiveClusterPixelRadius]);

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

			addLog(`Building clicked: ${title} (id=${buildingId ?? 'unknown'})${lat !== null ? ` @ ${lat}, ${lng}` : ''}`);

			if (buildingId) {
				// Log which buildings_organizations entries are linked to this building
				const matchedBuildingOrgs = (buildingsOrganizations as DatabaseTypes.BuildingsOrganizations[]).filter((entry) => {
					const entryBuildingId =
						typeof entry.buildings_id === 'string'
							? entry.buildings_id
							: (entry.buildings_id as DatabaseTypes.Buildings | null)?.id;
					return entryBuildingId === buildingId;
				});
				addLog(
					`buildings_organizations found: ${matchedBuildingOrgs.length}` +
					(matchedBuildingOrgs.length > 0
						? ` [${matchedBuildingOrgs.map((e) => `bo.id=${e.id} org=${typeof e.organizations_id === 'string' ? e.organizations_id : (e.organizations_id as DatabaseTypes.Organizations | null)?.id ?? '?'}`).join(', ')}]`
						: '')
				);

				// Log which organizations were resolved for this building
				const resolvedOrgs = buildingIdToOrgsDict[buildingId] ?? [];
				addLog(
					`Resolved organizations: ${resolvedOrgs.length}` +
					(resolvedOrgs.length > 0
						? ` [${resolvedOrgs.map((o) => `id=${o.id} color=${o.map_marker_color ?? 'none'}`).join(', ')}]`
						: '')
				);
			}

			if (coords && coords.length === 2) {
				setMapCenterOverride({ lat: Number(coords[1]), lng: Number(coords[0]) });
				setMapZoom(DEFAULT_ZOOM);
			}

			if (buildingId) {
				openBuildingDetailsModal(buildingId);
			}
		},
		[buildings, buildingsOrganizations, buildingIdToOrgsDict, clusteredBuildingMarkers, openBuildingDetailsModal, addLog],
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

	// Compass: reset map view to center position (Leaflet always points north)
	const handleCompassPress = useCallback(() => {
		setMapCenterOverride({ ...centerPosition });
		setMapZoom(DEFAULT_ZOOM);
	}, [centerPosition]);

	// Location: request permission and center map on user position
	const handleLocationPress = useCallback(async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Standort', 'Standortberechtigung wurde verweigert.');
				return;
			}
			const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
			const { latitude, longitude } = location.coords;
			setUserLocation({ lat: latitude, lng: longitude });
			setMapCenterOverride({ lat: latitude, lng: longitude });
			addLog(`Standort: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
		} catch (error) {
			console.error('Location error:', error);
			Alert.alert('Standort', 'Standort konnte nicht ermittelt werden.');
		}
	}, [addLog]);

	// User location marker (non-clustered)
	const userLocationMarkers = useMemo((): MapMarker[] => {
		if (!userLocation) return [];
		const size = 28;
		return [{
			id: 'user-location',
			position: userLocation,
			icon: createUserLocationMarkerSvg(),
			size: [size, size] as [number, number],
			iconAnchor: [size / 2, size / 2] as [number, number],
		}];
	}, [userLocation]);

	return (
		<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header.background }]}>
			<LeafletMapHeader
				drawerPosition={drawerPosition}
				query={searchQuery}
				onQueryChange={setSearchQuery}
				onSettingsPress={openSettingsModal}
				onFilterPress={openFilterModal}
				isFilterActive={Object.keys(organisationLikes).length > 0}
			/>
			<View style={styles.contentArea}>
				<View style={styles.container}>
					<MyMap
						key={`${selectedTileVariantKey}-${useVirtualZoom}`}
						mapCenterPosition={mapCenterOverride ?? centerPosition}
						zoom={mapZoom}
						mapMarkers={effectiveBuildingMarkers}
						noClusterMarkers={userLocationMarkers}
						mapLayers={[selectedTileLayer]}
						useFlyAnimation={useFlyAnimation}
						onMarkerClick={handleMarkerClick}
						onMapEvent={handleMapEvent}
					/>
					{/* Map overlay buttons: compass and location */}
					<View style={styles.mapOverlayButtons} pointerEvents="box-none">
						<TouchableOpacity
							style={[styles.mapOverlayButton, { backgroundColor: theme.screen.background }]}
							onPress={handleCompassPress}
						>
							<MaterialIcons name="explore" size={26} color={theme.screen.icon} />
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.mapOverlayButton, { backgroundColor: theme.screen.background, marginTop: 8 }]}
							onPress={handleLocationPress}
						>
							<MaterialIcons name="my-location" size={26} color={userLocation ? '#1a73e8' : theme.screen.icon} />
						</TouchableOpacity>
					</View>
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
	mapOverlayButtons: {
		position: 'absolute',
		top: 16,
		right: 12,
		zIndex: 20,
		elevation: 20,
		alignItems: 'center',
	},
	mapOverlayButton: {
		width: 44,
		height: 44,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
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
