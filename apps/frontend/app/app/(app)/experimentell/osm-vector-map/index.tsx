import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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
import { DatabaseTypes } from 'repo-depkit-common';
import { useDispatch } from 'react-redux';
import { SET_OSM_VECTOR_MAP_ORGANISATION_FILTER, SET_OSM_VECTOR_MAP_STYLE_KEY, SET_OSM_VECTOR_MAP_USE_FLY_ANIMATION } from '@/redux/Types/types';
import { clusterMarkers } from '@/components/MyMap/clusterUtils';
import { MARKER_DEFAULT_SIZE } from '@/components/MyMap/markerUtils';
import { MapMarker } from '@/components/MyMap/model';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import LeafletMapHeader from '@/app/(app)/leaflet-map/components/LeafletMapHeader';
import DebugView from '@/components/DebugView';
import SettingsList from '@/components/SettingsList/SettingsList';
import SettingsListSelectOption from '@/components/SettingsListSelectOption/SettingsListSelectOption';
import SettingsListOrganisationFast from '@/components/SettingsListOrganisationFast';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import useBuildingDetailsModal from '@/hooks/useBuildingDetailsModal';
import { Entypo } from '@expo/vector-icons';

type BuildingCoordinates = { coordinates?: [number, number] } | null;

type OsmStyleVariant = {
	key: string;
	label: string;
	url: string;
};

const OSM_STYLE_VARIANTS: OsmStyleVariant[] = [
	{ key: 'liberty', label: 'Liberty (Standard)', url: 'https://tiles.openfreemap.org/styles/liberty' },
	{ key: 'bright', label: 'Bright', url: 'https://tiles.openfreemap.org/styles/bright' },
	{ key: 'positron', label: 'Positron (Hell)', url: 'https://tiles.openfreemap.org/styles/positron' },
	{ key: 'dark-matter', label: 'Dark Matter (Dunkel)', url: 'https://tiles.openfreemap.org/styles/dark-matter' },
];

type OsmSettingsContentProps = {
	initialSelectedStyleKey: string;
	initialUseFlyAnimation: boolean;
	onSelectedStyleChange: (key: string) => void;
	onFlyAnimationChange: (value: boolean) => void;
	theme: ReturnType<typeof useTheme>['theme'];
};

const OsmSettingsContent: React.FC<OsmSettingsContentProps> = ({
	initialSelectedStyleKey,
	initialUseFlyAnimation,
	onSelectedStyleChange,
	onFlyAnimationChange,
	theme,
}) => {
	const [selectedStyleKey, setSelectedStyleKey] = useState(initialSelectedStyleKey);
	const [localFlyAnimation, setLocalFlyAnimation] = useState(initialUseFlyAnimation);
	const [showingStyleSelector, setShowingStyleSelector] = useState(false);

	if (showingStyleSelector) {
		return (
			<SettingsListSelectOption
				options={OSM_STYLE_VARIANTS.map((v) => ({ id: v.key, label: v.label }))}
				selectedOption={selectedStyleKey}
				onSelect={(option) => {
					setSelectedStyleKey(option.id);
					onSelectedStyleChange(option.id);
					setShowingStyleSelector(false);
				}}
				noIconIndent
			/>
		);
	}

	return (
		<>
			<SettingsList
				title="Kartenstil"
				value={(OSM_STYLE_VARIANTS.find((v) => v.key === selectedStyleKey) ?? OSM_STYLE_VARIANTS[0]).label}
				rightIcon={<Entypo name="chevron-small-right" size={24} color={theme.screen.icon} />}
				onPress={() => setShowingStyleSelector(true)}
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
				groupPosition="bottom"
				showSeparator={false}
				noIconIndent
			/>
		</>
	);
};

type OsmFilterContentProps = {
	organisations: DatabaseTypes.Organizations[];
	initialLikes: Record<string, boolean | null>;
	onLikeChange: (organisationId: string, like: boolean) => void;
	onResetAll: () => void;
};

const OsmFilterContent: React.FC<OsmFilterContentProps> = ({
	organisations,
	initialLikes,
	onLikeChange,
	onResetAll,
}) => {
	const [localLikes, setLocalLikes] = useState<Record<string, boolean | null>>(initialLikes);
	const { translate } = useLanguage();

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
		[onLikeChange],
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
		[onLikeChange],
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

const POSITION_BUNDESTAG = {
	lat: 52.518594247456804,
	lng: 13.376281624711964,
};

const MAX_LOG_ENTRIES = 50;
const MAX_ZOOM = 20;
const DEFAULT_ZOOM = 17;
const BUILDING_MARKER_SIZE = MARKER_DEFAULT_SIZE;
const BUILDING_MARKER_COLOR = '#1565c0';
const MAX_BUILDING_LABEL_CHARS = 3;
const MAX_SEARCH_RESULTS = 3;

function getContrastColor(hexColor: string): string {
	const hex = hexColor.replace('#', '');
	if (hex.length !== 6) return '#ffffff';
	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;
	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	const WCAG_LIGHT_THRESHOLD = 0.179;
	return luminance > WCAG_LIGHT_THRESHOLD ? '#000000' : '#ffffff';
}

function getFirstOrganisationFromDict(
	buildingId: string,
	buildingIdToOrgsDict: Record<string, DatabaseTypes.Organizations[]>,
): DatabaseTypes.Organizations | null {
	const orgs = buildingIdToOrgsDict[buildingId];
	return orgs && orgs.length > 0 ? orgs[0] : null;
}

function createBuildingMarkerSvg(
	externalIdentifier?: string | null,
	markerColor?: string | null,
	markerLabel?: string | null,
	markerLabelColor?: string | null,
	orgMarkerColor?: string | null,
	orgMarkerLabelColor?: string | null,
	fallbackColor?: string | null,
	fallbackLabelColor?: string | null,
): string {
	const size = BUILDING_MARKER_SIZE;
	const cx = size / 2;
	const cy = size / 2;
	const r = cx - 2;
	const fillColor = markerColor || orgMarkerColor || fallbackColor || BUILDING_MARKER_COLOR;
	const textColor = markerLabelColor || orgMarkerLabelColor || fallbackLabelColor || 'white';
	const rawLabel = markerLabel ?? externalIdentifier;
	const label = rawLabel ? rawLabel.slice(0, MAX_BUILDING_LABEL_CHARS) : null;
	const circleEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="white" stroke-width="2" opacity="0.9"/>`;
	const textEl = label
		? `<text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="${textColor}" font-family="Arial,sans-serif" font-size="12" font-weight="bold">${label}</text>`
		: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${circleEl}${textEl}</svg>`;
}

const OsmVectorMapScreen: React.FC = () => {
	useSetPageTitle(TranslationKeys.osm_vector_map);
	const { theme } = useTheme();
	const webViewRef = useRef<WebView>(null);
	const [html, setHtml] = useState<string | null>(null);

	const { buildings, buildingsOrganizations, organisations } = useAppSelector((state) => state.canteenReducer);
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);
	const drawerPosition = useAppSelector((state) => state.settings.drawerPosition);
	const selectedStyleKey = useAppSelector((state) => (state.settings as any).osmVectorMapStyleKey ?? 'liberty');
	const useFlyAnimation = useAppSelector((state) => (state.settings as any).osmVectorMapUseFlyAnimation ?? true);
	const organisationLikes = useAppSelector(
		(state) => ((state.settings as any).osmVectorMapOrganisationFilter ?? {}) as Record<string, boolean | null>,
	);
	const dispatch = useDispatch();
	const selectedCanteen = useSelectedCanteen();
	const { openBuildingDetailsModal } = useBuildingDetailsModal();
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const [logEntries, setLogEntries] = useState<string[]>([]);
	const logScrollRef = useRef<ScrollView>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
	const [mapCenterOverride, setMapCenterOverride] = useState<{ lat: number; lng: number } | null>(null);

	const handleOrganisationLikeChangeRef = useRef<(orgId: string, like: boolean) => void>(() => {});
	const handleResetAllFiltersRef = useRef<() => void>(() => {});

	const addLog = useCallback((entry: string) => {
		setLogEntries((prev) => {
			const next = [...prev, `${new Date().toLocaleTimeString()}: ${entry}`];
			return next.length > MAX_LOG_ENTRIES ? next.slice(next.length - MAX_LOG_ENTRIES) : next;
		});
	}, []);

	const organisationsDict = useMemo(
		() =>
			(organisations as DatabaseTypes.Organizations[]).reduce<Record<string, DatabaseTypes.Organizations>>(
				(acc, org) => {
					acc[org.id] = org;
					return acc;
				},
				{},
			),
		[organisations],
	);

	const buildingIdToOrgsDict = useMemo(
		() => BuildingsHelper.getBuildingIdToOrganizationsDict(buildingsOrganizations, organisationsDict),
		[buildingsOrganizations, organisationsDict],
	);

	const primaryColorContrastColor = useMemo(() => getContrastColor(primaryColor), [primaryColor]);

	const handleOrganisationLikeChange = useCallback(
		(orgId: string, like: boolean) => {
			const current = organisationLikes[orgId];
			const next = current === like ? null : like;
			const updated = { ...organisationLikes };
			if (next === null) {
				delete updated[orgId];
			} else {
				updated[orgId] = next;
			}
			dispatch({ type: SET_OSM_VECTOR_MAP_ORGANISATION_FILTER, payload: updated });
		},
		[dispatch, organisationLikes],
	);
	handleOrganisationLikeChangeRef.current = handleOrganisationLikeChange;

	const stableOnOrganisationLikeChange = useCallback((orgId: string, like: boolean) => {
		handleOrganisationLikeChangeRef.current(orgId, like);
	}, []);

	const handleResetAllFilters = useCallback(() => {
		dispatch({ type: SET_OSM_VECTOR_MAP_ORGANISATION_FILTER, payload: {} });
	}, [dispatch]);
	handleResetAllFiltersRef.current = handleResetAllFilters;

	const stableOnResetAllFilters = useCallback(() => {
		handleResetAllFiltersRef.current();
	}, []);

	const setSelectedStyleKey = useCallback(
		(key: string) => {
			dispatch({ type: SET_OSM_VECTOR_MAP_STYLE_KEY, payload: key });
		},
		[dispatch],
	);

	const setUseFlyAnimationDispatch = useCallback(
		(value: boolean) => {
			dispatch({ type: SET_OSM_VECTOR_MAP_USE_FLY_ANIMATION, payload: value });
		},
		[dispatch],
	);

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

	useEffect(() => {
		setMapCenterOverride(null);
	}, [centerPosition]);

	const likedOrganisationIds = useMemo(
		() =>
			Object.entries(organisationLikes)
				.filter(([, v]) => v === true)
				.map(([k]) => k),
		[organisationLikes],
	);

	const dislikedOrganisationIds = useMemo(
		() =>
			Object.entries(organisationLikes)
				.filter(([, v]) => v === false)
				.map(([k]) => k),
		[organisationLikes],
	);

	const buildingMarkers = useMemo((): MapMarker[] => {
		return (buildings as DatabaseTypes.Buildings[])
			.filter((building) => {
				const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
				if (!coords || coords.length !== 2) return false;
				const orgIds = (buildingIdToOrgsDict[building.id] ?? []).map((org) => org.id);
				if (likedOrganisationIds.length > 0) {
					if (orgIds.length === 0) return true;
					if (!orgIds.some((id) => likedOrganisationIds.includes(id))) return false;
				}
				if (dislikedOrganisationIds.length > 0 && orgIds.length > 0) {
					const nonDislikedOrgIds = orgIds.filter((id) => !dislikedOrganisationIds.includes(id));
					if (nonDislikedOrgIds.length === 0) return false;
				}
				return true;
			})
			.map((building) => {
				const coords = (building.coordinates as BuildingCoordinates)!.coordinates!;
				const [lng, lat] = coords;
				const firstOrg = getFirstOrganisationFromDict(building.id, buildingIdToOrgsDict);
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
					),
					size: [BUILDING_MARKER_SIZE, BUILDING_MARKER_SIZE] as [number, number],
					iconAnchor: [BUILDING_MARKER_SIZE / 2, BUILDING_MARKER_SIZE / 2] as [number, number],
				};
			});
	}, [buildings, buildingIdToOrgsDict, likedOrganisationIds, dislikedOrganisationIds, primaryColor, primaryColorContrastColor]);

	const clusteredBuildingMarkers = useMemo(() => clusterMarkers(buildingMarkers, mapZoom), [buildingMarkers, mapZoom]);

	const searchResults = useMemo((): DatabaseTypes.Buildings[] => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		return (buildings as DatabaseTypes.Buildings[])
			.filter((b) => (b.alias ?? '').toLowerCase().includes(q))
			.slice(0, MAX_SEARCH_RESULTS);
	}, [buildings, searchQuery]);

	const handleSearchResultSelect = useCallback((building: DatabaseTypes.Buildings) => {
		const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
		if (coords && coords.length === 2) {
			setMapCenterOverride({ lat: Number(coords[1]), lng: Number(coords[0]) });
		}
		setSearchQuery('');
		Keyboard.dismiss();
	}, []);

	const selectedStyleUrl = useMemo(
		() => (OSM_STYLE_VARIANTS.find((v) => v.key === selectedStyleKey) ?? OSM_STYLE_VARIANTS[0]).url,
		[selectedStyleKey],
	);

	const sendMapData = useCallback(() => {
		const effectiveCenter = mapCenterOverride ?? centerPosition;
		const message = JSON.stringify({
			mapCenterPosition: effectiveCenter,
			zoom: mapZoom,
			mapMarkers: clusteredBuildingMarkers,
			mapStyle: selectedStyleUrl,
			useFlyAnimation,
		});
		webViewRef.current?.injectJavaScript(
			`window.dispatchEvent(new MessageEvent('message',{data:${message}}));true;`,
		);
	}, [mapCenterOverride, centerPosition, mapZoom, clusteredBuildingMarkers, selectedStyleUrl, useFlyAnimation]);

	useEffect(() => {
		sendMapData();
	}, [sendMapData]);

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

	const handleMarkerClick = useCallback(
		(id: string) => {
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

	const handleMessage = useCallback(
		(event: WebViewMessageEvent) => {
			try {
				const data = JSON.parse(event.nativeEvent.data);
				if (data.tag === 'MapComponentMounted') {
					sendMapData();
					addLog('MapComponentMounted');
					return;
				}
				if (data.tag === 'onZoomEnd') {
					setMapZoom(data.zoom);
					addLog(`Zoom: ${data.zoom ?? 'unknown'}`);
				}
				if (data.tag === 'onMapMarkerClicked') {
					handleMarkerClick(data.mapMarkerId);
				}
			} catch {
				// ignore malformed messages
			}
		},
		[sendMapData, handleMarkerClick, addLog],
	);

	const handleShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest): boolean => {
		const url = request.url;
		if (!url || url === 'about:blank' || url === 'about:srcdoc') {
			return true;
		}
		CommonSystemActionHelper.openExternalURL(url).catch(() => {});
		return false;
	}, []);

	const openSettingsModal = useCallback(() => {
		show({
			title: 'Karten Einstellungen',
			children: (
				<OsmSettingsContent
					initialSelectedStyleKey={selectedStyleKey}
					initialUseFlyAnimation={useFlyAnimation}
					onSelectedStyleChange={setSelectedStyleKey}
					onFlyAnimationChange={setUseFlyAnimationDispatch}
					theme={theme}
				/>
			),
		});
	}, [show, selectedStyleKey, useFlyAnimation, theme, setSelectedStyleKey, setUseFlyAnimationDispatch]);

	const openFilterModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.organisations),
			children: (
				<OsmFilterContent
					organisations={organisations as DatabaseTypes.Organizations[]}
					initialLikes={organisationLikes}
					onLikeChange={stableOnOrganisationLikeChange}
					onResetAll={stableOnResetAllFilters}
				/>
			),
		});
	}, [show, translate, organisations, organisationLikes, stableOnOrganisationLikeChange, stableOnResetAllFilters]);

	const isFilterActive = useMemo(() => Object.keys(organisationLikes).length > 0, [organisationLikes]);

	if (!html) {
		return <View style={[styles.safeArea, { backgroundColor: theme.screen.background }]} />;
	}

	return (
		<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header.background }]}>
			<LeafletMapHeader
				drawerPosition={drawerPosition}
				query={searchQuery}
				onQueryChange={setSearchQuery}
				onSettingsPress={openSettingsModal}
				onFilterPress={openFilterModal}
				isFilterActive={isFilterActive}
			/>
			<View style={styles.contentArea}>
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

const styles = StyleSheet.create({
	safeArea: { flex: 1 },
	contentArea: { flex: 1, position: 'relative' },
	container: { flex: 1 },
	webView: { flex: 1 },
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

export default OsmVectorMapScreen;
