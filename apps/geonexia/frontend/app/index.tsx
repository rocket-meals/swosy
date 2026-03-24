import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { isRunningInExpoGo } from 'expo';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MapLocationButton, MapNorthButton, MyMap, MyMapHandle, useTheme, useMyScrollViewModal } from 'repo-depkit-common-ui';

import { HEX_TILE_SCRIPT } from '../assets/hexTileScript';
import { isAvailable as isH3Available, latLngToCell, gridDisk, gridDistance, cellToBoundary } from '../helpers/H3Helper';
import { RoutePoint, RunStats, saveActivity, saveOsmConsent, loadOsmConsent } from '../helpers/ActivityStorage';

const PRIMARY_COLOR = '#2563eb';

// Debug status indicator colours
const STATUS_SUCCESS_COLOR = '#22c55e';
const STATUS_WARNING_COLOR = '#f59e0b';
const STATUS_ERROR_COLOR = '#ef4444';

// ─── H3 hex-grid helpers ──────────────────────────────────────────────────────

const H3_DEFAULT_RESOLUTION = 9;
const H3_MAX_CELLS = 5000;
const H3_MIN_ZOOM = 14;
// cellToBoundary flag: true returns vertices in [lng, lat] GeoJSON coordinate order
// AND automatically closes the ring (appends the first vertex at the end).
const H3_GEOJSON_ORDER = true;

type ViewportBounds = { north: number; south: number; east: number; west: number };

type H3GeoJsonFeature = {
	type: 'Feature';
	geometry: { type: 'Polygon'; coordinates: number[][][] };
	properties: { h3Index: string };
};

type H3FeatureCollection = {
	type: 'FeatureCollection';
	features: H3GeoJsonFeature[];
};

function buildH3GeoJson(
	bounds: ViewportBounds,
	zoom: number,
	resolution: number,
	showAlways: boolean,
): H3FeatureCollection {
	if (!showAlways && zoom < H3_MIN_ZOOM) return { type: 'FeatureCollection', features: [] };

	const centerLat = (bounds.north + bounds.south) / 2;
	const centerLng = (bounds.east + bounds.west) / 2;
	const centerCell = latLngToCell(centerLat, centerLng, resolution);

	// Determine how many grid rings are needed to cover all four viewport corners.
	const corners: Array<[number, number]> = [
		[bounds.north, bounds.east],
		[bounds.north, bounds.west],
		[bounds.south, bounds.east],
		[bounds.south, bounds.west],
	];
	let maxK = 0;
	for (const [lat, lng] of corners) {
		try {
			const cornerCell = latLngToCell(lat, lng, resolution);
			const dist = gridDistance(centerCell, cornerCell);
			if (dist > maxK) maxK = dist;
		} catch (err) {
			// gridDistance can throw when cells span different icosahedron faces.
			console.warn('[H3] gridDistance failed for corner cell:', err);
		}
	}

	const k = Math.min(maxK + 1, 30);
	const cells = gridDisk(centerCell, k);

	const features: H3GeoJsonFeature[] = [];
	for (const cell of cells) {
		if (features.length >= H3_MAX_CELLS) break;
		const boundary = cellToBoundary(cell, H3_GEOJSON_ORDER);
		// H3_GEOJSON_ORDER=true already closes the ring; no need to append boundary[0] again.
		features.push({
			type: 'Feature',
			geometry: { type: 'Polygon', coordinates: [boundary as number[][]] },
			properties: { h3Index: cell },
		});
	}

	return { type: 'FeatureCollection', features };
}

// ─── Computation constants ────────────────────────────────────────────────────

const DEFAULT_RUNNER_WEIGHT_KG = 75;
const KCAL_PER_KG_PER_KM = 0.9;
const AVERAGE_STRIDE_LENGTH_METERS = 0.77;
const FLUID_BASELINE_DURATION_SECONDS = 1800;
const FLUID_BASELINE_ML = 500;
const GPS_TIME_INTERVAL_MS = 5000;
const GPS_DISTANCE_INTERVAL_METERS = 5;

// ─── Background task ──────────────────────────────────────────────────────────

const ACTIVITY_LOCATION_TASK = 'geonexia-activity-location';

// Module-level callback invoked from the background task to notify the active component.
// This reference is set when recording starts and cleared when recording stops.
let _onLocationUpdate: ((point: RoutePoint) => void) | null = null;

TaskManager.defineTask(ACTIVITY_LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
	if (error || !data) return;
	const locations = (data as { locations: Location.LocationObject[] }).locations;
	if (!Array.isArray(locations)) return;
	for (const loc of locations) {
		const point: RoutePoint = {
			lat: loc.coords.latitude,
			lng: loc.coords.longitude,
			altitude: loc.coords.altitude,
			speed: loc.coords.speed,
			timestamp: loc.timestamp,
		};
		if (_onLocationUpdate) {
			_onLocationUpdate(point);
		}
	}
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeStats(points: RoutePoint[]): RunStats {
	if (points.length < 2) {
		const durationSeconds = points.length === 1 ? (Date.now() - points[0].timestamp) / 1000 : 0;
		return {
			distanceKm: 0,
			durationSeconds,
			paceMinPerKm: 0,
			maxSpeedKmh: 0,
			minSpeedKmh: 0,
			avgSpeedKmh: 0,
			kcal: 0,
			steps: 0,
			elevationGainM: 0,
			elevationLossM: 0,
			fluidNeedsMl: 0,
		};
	}

	let distanceKm = 0;
	let elevationGainM = 0;
	let elevationLossM = 0;
	const speedsKmh: number[] = [];

	for (let i = 1; i < points.length; i++) {
		const segKm = haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
		distanceKm += segKm;

		if (points[i].altitude != null && points[i - 1].altitude != null) {
			const diff = (points[i].altitude as number) - (points[i - 1].altitude as number);
			if (diff > 0) elevationGainM += diff;
			else elevationLossM += Math.abs(diff);
		}

		const dtSec = (points[i].timestamp - points[i - 1].timestamp) / 1000;
		const gpsSpeed = points[i].speed;
		const segSpeedKmh =
			gpsSpeed != null && gpsSpeed >= 0
				? gpsSpeed * 3.6
				: dtSec > 0
				? (segKm / dtSec) * 3600
				: 0;
		if (segSpeedKmh > 0) speedsKmh.push(segSpeedKmh);
	}

	const durationSeconds = (points[points.length - 1].timestamp - points[0].timestamp) / 1000;
	const paceMinPerKm = distanceKm > 0 ? durationSeconds / 60 / distanceKm : 0;
	const maxSpeedKmh = speedsKmh.length > 0 ? Math.max(...speedsKmh) : 0;
	const minSpeedKmh = speedsKmh.length > 0 ? Math.min(...speedsKmh) : 0;
	const avgSpeedKmh = durationSeconds > 0 ? (distanceKm / durationSeconds) * 3600 : 0;
	const kcal = Math.round(distanceKm * DEFAULT_RUNNER_WEIGHT_KG * KCAL_PER_KG_PER_KM);
	const steps = Math.round((distanceKm * 1000) / AVERAGE_STRIDE_LENGTH_METERS);
	const fluidNeedsMl = Math.round((durationSeconds / FLUID_BASELINE_DURATION_SECONDS) * FLUID_BASELINE_ML);

	return {
		distanceKm,
		durationSeconds,
		paceMinPerKm,
		maxSpeedKmh,
		minSpeedKmh,
		avgSpeedKmh,
		kcal,
		steps,
		elevationGainM,
		elevationLossM,
		fluidNeedsMl,
	};
}

function formatDuration(totalSeconds: number): string {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = Math.floor(totalSeconds % 60);
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPace(minPerKm: number): string {
	if (minPerKm <= 0 || !isFinite(minPerKm)) return '--:--';
	const m = Math.floor(minPerKm);
	const s = Math.round((minPerKm - m) * 60);
	return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)} m`;
	return `${km.toFixed(2)} km`;
}

// ─── Debug viewport info ─────────────────────────────────────────────────────

type DebugViewportInfo = {
	bounds: ViewportBounds;
	zoom: number;
	tileCount: number;
};

// ─── Debug Info Content (shown inside the debug modal) ───────────────────────

type DebugInfoContentProps = {
	info: DebugViewportInfo | null;
	theme: ReturnType<typeof useTheme>['theme'];
	initialShowGridAlways: boolean;
	initialH3Resolution: number;
	onShowGridAlwaysChange: (val: boolean) => void;
	onH3ResolutionChange: (val: number) => void;
};

const H3_RESOLUTION_MIN = 0;
const H3_RESOLUTION_MAX = 15;

function DebugInfoContent({
	info,
	theme,
	initialShowGridAlways,
	initialH3Resolution,
	onShowGridAlwaysChange,
	onH3ResolutionChange,
}: DebugInfoContentProps) {
	const h3Available = isH3Available();
	const [showGridAlways, setShowGridAlways] = useState(initialShowGridAlways);
	const [h3Resolution, setH3Resolution] = useState(initialH3Resolution);

	const handleShowGridAlwaysChange = useCallback((val: boolean) => {
		setShowGridAlways(val);
		onShowGridAlwaysChange(val);
	}, [onShowGridAlwaysChange]);

	const decrementResolution = useCallback(() => {
		setH3Resolution((prev) => {
			const next = Math.max(H3_RESOLUTION_MIN, prev - 1);
			onH3ResolutionChange(next);
			return next;
		});
	}, [onH3ResolutionChange]);

	const incrementResolution = useCallback(() => {
		setH3Resolution((prev) => {
			const next = Math.min(H3_RESOLUTION_MAX, prev + 1);
			onH3ResolutionChange(next);
			return next;
		});
	}, [onH3ResolutionChange]);

	const tilesExpected = info != null && (showGridAlways || info.zoom >= H3_MIN_ZOOM);

	const statusColor = !h3Available
		? STATUS_ERROR_COLOR
		: info == null
		? STATUS_WARNING_COLOR
		: !tilesExpected
		? STATUS_WARNING_COLOR
		: info.tileCount > 0
		? STATUS_SUCCESS_COLOR
		: STATUS_ERROR_COLOR;

	const statusText = !h3Available
		? '❌ H3 library failed to initialise'
		: info == null
		? '⚠️ No viewport data yet. Move or zoom the map.'
		: !tilesExpected
		? `⚠️ Zoom in to ≥${H3_MIN_ZOOM} to see tiles`
		: info.tileCount > 0
		? `✅ ${info.tileCount} H3 tiles computed`
		: '❌ 0 tiles – H3 library may not be working';

	const viewportRows: { label: string; value: string }[] = info
		? [
			{ label: 'Zoom Level', value: info.zoom.toFixed(2) },
			{ label: 'Tiles Visible', value: tilesExpected ? `${info.tileCount} cells` : `0 (zoom < ${H3_MIN_ZOOM})` },
			{ label: 'North', value: info.bounds.north.toFixed(5) },
			{ label: 'South', value: info.bounds.south.toFixed(5) },
			{ label: 'East', value: info.bounds.east.toFixed(5) },
			{ label: 'West', value: info.bounds.west.toFixed(5) },
		]
		: [];

	return (
		<View style={styles.debugContainer}>
			<View style={[styles.debugStatusBanner, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
				<Text selectable style={[styles.debugStatusText, { color: statusColor }]}>{statusText}</Text>
			</View>

			{/* H3 Library row */}
			<View style={[styles.debugRow, { borderBottomColor: theme.screen.text + '22' }]}>
				<Text selectable style={[styles.debugRowLabel, { color: theme.screen.text }]}>H3 Library</Text>
				<Text selectable style={[styles.debugRowValue, { color: theme.screen.text }]}>
					{h3Available ? '✅ Available' : '❌ Not available'}
				</Text>
			</View>

			{/* Show Grid Always toggle */}
			<View style={[styles.debugRow, { borderBottomColor: theme.screen.text + '22' }]}>
				<Text selectable style={[styles.debugRowLabel, { color: theme.screen.text }]}>Show Grid Always</Text>
				<Switch
					value={showGridAlways}
					onValueChange={handleShowGridAlwaysChange}
					trackColor={{ true: PRIMARY_COLOR }}
					thumbColor="#ffffff"
				/>
			</View>

			{/* H3 Grid Resolution picker */}
			<View style={[styles.debugRow, { borderBottomColor: theme.screen.text + '22' }]}>
				<Text selectable style={[styles.debugRowLabel, { color: theme.screen.text }]}>H3 Grid Resolution</Text>
				<View style={styles.resolutionPicker}>
					<TouchableOpacity
						style={[styles.resolutionButton, { opacity: h3Resolution <= H3_RESOLUTION_MIN ? 0.4 : 1 }]}
						onPress={decrementResolution}
						disabled={h3Resolution <= H3_RESOLUTION_MIN}
					>
						<Text style={styles.resolutionButtonText}>−</Text>
					</TouchableOpacity>
					<Text style={[styles.resolutionValue, { color: theme.screen.text }]}>{h3Resolution}</Text>
					<TouchableOpacity
						style={[styles.resolutionButton, { opacity: h3Resolution >= H3_RESOLUTION_MAX ? 0.4 : 1 }]}
						onPress={incrementResolution}
						disabled={h3Resolution >= H3_RESOLUTION_MAX}
					>
						<Text style={styles.resolutionButtonText}>+</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Min zoom info row */}
			<View style={[styles.debugRow, { borderBottomColor: theme.screen.text + '22' }]}>
				<Text selectable style={[styles.debugRowLabel, { color: theme.screen.text }]}>Min Zoom for Tiles</Text>
				<Text selectable style={[styles.debugRowValue, { color: theme.screen.text }]}>
					{showGridAlways ? 'disabled (always on)' : String(H3_MIN_ZOOM)}
				</Text>
			</View>

			{/* Viewport rows */}
			{viewportRows.map((row) => (
				<View key={row.label} style={[styles.debugRow, { borderBottomColor: theme.screen.text + '22' }]}>
					<Text selectable style={[styles.debugRowLabel, { color: theme.screen.text }]}>{row.label}</Text>
					<Text selectable style={[styles.debugRowValue, { color: theme.screen.text }]}>{row.value}</Text>
				</View>
			))}
		</View>
	);
}

// ─── OSM Consent Screen ───────────────────────────────────────────────────────

function OsmConsentScreen({ onConsent }: { onConsent: () => void }) {
	return (
		<ScrollView contentContainerStyle={styles.consentContainer}>
			<Ionicons name="map-outline" size={56} color={PRIMARY_COLOR} style={styles.consentIcon} />
			<Text style={styles.consentTitle}>Map display with OpenStreetMap</Text>
			<Text style={styles.consentBody}>
				This map loads map data from{' '}
				<Text style={styles.consentBold}>OpenStreetMap</Text>{' '}
				(openstreetmap.org) and{' '}
				<Text style={styles.consentBold}>OpenFreeMap</Text>{' '}
				(openfreemap.org). Data such as your IP address will be transmitted to
				servers of the OpenStreetMap Foundation and Protomaps LLC.
			</Text>
			<Text style={styles.consentNote}>
				Your consent is saved and will persist across app restarts. You can reset it by clearing the app's data.
			</Text>
			<TouchableOpacity style={styles.consentButton} onPress={onConsent} activeOpacity={0.8}>
				<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
				<Text style={styles.consentButtonText}>Load map data (Accept)</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

// ─── Run Stats Content (used inside bottom sheet modal) ───────────────────────

function RunStatsContent({ stats, theme }: { stats: RunStats; theme: ReturnType<typeof useTheme>['theme'] }) {
	const rows: { iconName: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }[] = [
		{ iconName: 'straighten', label: 'Distance', value: formatDistance(stats.distanceKm) },
		{ iconName: 'timer', label: 'Duration', value: formatDuration(stats.durationSeconds) },
		{ iconName: 'speed', label: 'Pace', value: formatPace(stats.paceMinPerKm) + ' min/km' },
		{ iconName: 'speed', label: 'Avg. Speed', value: `${stats.avgSpeedKmh.toFixed(1)} km/h` },
		{ iconName: 'arrow-upward', label: 'Max. Speed', value: `${stats.maxSpeedKmh.toFixed(1)} km/h` },
		{ iconName: 'arrow-downward', label: 'Min. Speed', value: `${stats.minSpeedKmh.toFixed(1)} km/h` },
		{ iconName: 'local-fire-department', label: 'Calories', value: `${stats.kcal} kcal` },
		{ iconName: 'directions-walk', label: 'Steps (est.)', value: stats.steps.toLocaleString() },
		{ iconName: 'trending-up', label: 'Elevation Gain', value: `${Math.round(stats.elevationGainM)} m` },
		{ iconName: 'trending-down', label: 'Elevation Loss', value: `${Math.round(stats.elevationLossM)} m` },
		{ iconName: 'water-drop', label: 'Fluid Needs', value: `${stats.fluidNeedsMl} ml` },
	];

	return (
		<>
			{rows.map((row, index) => (
				<View
					key={row.label}
					style={[
						styles.statsRow,
						{ borderBottomColor: theme.screen.text + '22' },
						index === rows.length - 1 && styles.statsRowLast,
					]}
				>
					<MaterialIcons name={row.iconName} size={20} color={theme.screen.icon} style={styles.statsRowIcon} />
					<Text style={[styles.statsRowLabel, { color: theme.screen.text }]}>{row.label}</Text>
					<Text style={[styles.statsRowValue, { color: theme.screen.text }]}>{row.value}</Text>
				</View>
			))}
		</>
	);
}

// ─── Record Screen ─────────────────────────────────────────────────────────────

export default function RecordScreen() {
	const { theme } = useTheme();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const router = useRouter();
	const [osmConsent, setOsmConsent] = useState(false);
	const mapRef = useRef<MyMapHandle>(null);

	const [isRecording, setIsRecording] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [liveDistanceKm, setLiveDistanceKm] = useState(0);
	const [liveSpeedKmh, setLiveSpeedKmh] = useState<number | null>(null);

	// Follow mode: when active the map stays centred on the user's location.
	const isFollowingRef = useRef(false);
	const [isFollowing, setIsFollowing] = useState(false);

	// Debug: last viewport info for the debug modal (ref avoids stale closure issues).
	const debugViewportRef = useRef<DebugViewportInfo | null>(null);

	// H3 grid settings (refs for synchronous access in callbacks)
	const showGridAlwaysRef = useRef(false);
	const [showGridAlways, setShowGridAlways] = useState(false);
	const h3ResolutionRef = useRef(H3_DEFAULT_RESOLUTION);
	const [h3Resolution, setH3Resolution] = useState(H3_DEFAULT_RESOLUTION);

	const setFollowMode = useCallback((val: boolean) => {
		isFollowingRef.current = val;
		setIsFollowing(val);
	}, []);

	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef<number>(0);
	const routePointsRef = useRef<RoutePoint[]>([]);
	// Foreground-only fallback subscription (used when background permission is denied)
	const fgSubRef = useRef<Location.LocationSubscription | null>(null);

	// Load persisted OSM consent on mount
	useEffect(() => {
		loadOsmConsent().then((consented) => {
			if (consented) setOsmConsent(true);
		});
	}, []);

	useEffect(() => {
		return () => {
			// Cleanup on unmount: stop any active tracking
			_onLocationUpdate = null;
			fgSubRef.current?.remove();
			if (timerRef.current) clearInterval(timerRef.current);
			Location.stopLocationUpdatesAsync(ACTIVITY_LOCATION_TASK).catch(() => {});
		};
	}, []);

	const handleConsent = useCallback(() => {
		setOsmConsent(true);
		saveOsmConsent(true);
	}, []);

	const sendRouteToMap = useCallback((points: RoutePoint[]) => {
		if (!mapRef.current) return;
		const coords = points.map((p) => [p.lng, p.lat]);
		mapRef.current.sendToMap({ routeCoordinates: coords });
	}, []);

	const recomputeH3 = useCallback(() => {
		const vp = debugViewportRef.current;
		if (!vp || !mapRef.current) return;
		let geoJson: H3FeatureCollection = { type: 'FeatureCollection', features: [] };
		try {
			geoJson = buildH3GeoJson(vp.bounds, vp.zoom, h3ResolutionRef.current, showGridAlwaysRef.current);
		} catch (err) {
			console.warn('[RecordScreen] buildH3GeoJson failed:', err);
		}
		debugViewportRef.current = { ...vp, tileCount: geoJson.features.length };
		mapRef.current.sendToMap({ hexTileGeoJson: geoJson });
	}, []);

	const handleShowGridAlwaysChange = useCallback((val: boolean) => {
		showGridAlwaysRef.current = val;
		setShowGridAlways(val);
		recomputeH3();
	}, [recomputeH3]);

	const handleH3ResolutionChange = useCallback((val: number) => {
		h3ResolutionRef.current = val;
		setH3Resolution(val);
		recomputeH3();
	}, [recomputeH3]);

	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			mapRef.current?.sendToMap({
				hexTileLayer: { color: 'rgba(0, 0, 0, 0)', strokeColor: PRIMARY_COLOR },
			});
			if (routePointsRef.current.length > 0) {
				sendRouteToMap(routePointsRef.current);
			}
		} else if (msg.tag === 'MapInteracted') {
			setFollowMode(false);
		} else if (msg.tag === 'MapViewportChanged') {
			const vp = msg as { bounds: ViewportBounds; zoom: number };
			let geoJson: H3FeatureCollection = { type: 'FeatureCollection', features: [] };
			try {
				geoJson = buildH3GeoJson(vp.bounds, vp.zoom, h3ResolutionRef.current, showGridAlwaysRef.current);
			} catch (err) {
				console.warn('[RecordScreen] buildH3GeoJson failed:', err);
			}
			debugViewportRef.current = { bounds: vp.bounds, zoom: vp.zoom, tileCount: geoJson.features.length };
			mapRef.current?.sendToMap({ hexTileGeoJson: geoJson });
		}
	}, [sendRouteToMap, setFollowMode]);

	const showDebugModal = useCallback(() => {
		const info = debugViewportRef.current;
		showModal({
			title: '🔍 Hex Tile Debug',
			onClose: closeModal,
			children: (
				<DebugInfoContent
					info={info}
					theme={theme}
					initialShowGridAlways={showGridAlwaysRef.current}
					initialH3Resolution={h3ResolutionRef.current}
					onShowGridAlwaysChange={handleShowGridAlwaysChange}
					onH3ResolutionChange={handleH3ResolutionChange}
				/>
			),
		});
	}, [showModal, closeModal, theme, handleShowGridAlwaysChange, handleH3ResolutionChange]);

	const handleLocationUpdate = useCallback((point: RoutePoint) => {
		const next = [...routePointsRef.current, point];
		routePointsRef.current = next;

		let d = 0;
		for (let i = 1; i < next.length; i++) {
			d += haversineKm(next[i - 1].lat, next[i - 1].lng, next[i].lat, next[i].lng);
		}
		setLiveDistanceKm(d);

		if (point.speed != null && point.speed >= 0) {
			setLiveSpeedKmh(point.speed * 3.6);
		}

		sendRouteToMap(next);
		mapRef.current?.sendToMap({ userLocation: { lat: point.lat, lng: point.lng } });

		if (isFollowingRef.current) {
			mapRef.current?.sendToMap({
				mapCenterPosition: { lat: point.lat, lng: point.lng },
				easeAnimation: true,
				easeDuration: 800,
			});
		}
	}, [sendRouteToMap]);

	const startRecording = useCallback(async () => {
		const expoGo = isRunningInExpoGo();
		console.log('[RecordScreen] startRecording called. isRunningInExpoGo:', expoGo);
		try {
			console.log('[RecordScreen] Requesting foreground location permission...');
			const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
			console.log('[RecordScreen] Foreground permission status:', fgStatus);
			if (fgStatus !== 'granted') {
				Alert.alert('GPS', 'Location permission is required for run recording.');
				return;
			}

			routePointsRef.current = [];
			startTimeRef.current = Date.now();
			setElapsedSeconds(0);
			setLiveDistanceKm(0);
			setLiveSpeedKmh(null);
			setIsRecording(true);
			mapRef.current?.sendToMap({ routeCoordinates: [] });

			timerRef.current = setInterval(() => {
				setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
			}, 1000);

			if (expoGo) {
				console.log('[RecordScreen] Running in Expo Go – skipping background permission, using foreground-only tracking.');
				showModal({
					title: 'Expo Go: Foreground Tracking Only',
					children: (
						<View style={styles.expoGoNoticeContainer}>
							<Text style={[styles.expoGoNoticeText, { color: theme.screen.text }]}>
								Background location is not supported in Expo Go.{'\n\n'}
								Location will only be tracked while this screen is open and the app is in the foreground.
								For full background tracking, run the app as a standalone build.
							</Text>
						</View>
					),
				});
				const sub = await Location.watchPositionAsync(
					{
						accuracy: Location.Accuracy.BestForNavigation,
						timeInterval: GPS_TIME_INTERVAL_MS,
						distanceInterval: GPS_DISTANCE_INTERVAL_METERS,
					},
					(loc) => {
						console.log('[RecordScreen] Foreground location update:', loc.coords.latitude, loc.coords.longitude);
						handleLocationUpdate({
							lat: loc.coords.latitude,
							lng: loc.coords.longitude,
							altitude: loc.coords.altitude,
							speed: loc.coords.speed,
							timestamp: loc.timestamp,
						});
					},
				);
				fgSubRef.current = sub;
				console.log('[RecordScreen] Foreground-only watch started (Expo Go).');
				return;
			}

			console.log('[RecordScreen] Requesting background location permission...');
			let bgStatus: Location.PermissionStatus | null = null;
			try {
				const bgResult = await Location.requestBackgroundPermissionsAsync();
				bgStatus = bgResult.status;
				console.log('[RecordScreen] Background permission status:', bgStatus);
			} catch (bgErr) {
				console.warn('[RecordScreen] Background permission request failed (may not be supported):', bgErr);
			}
			const useBackground = bgStatus === 'granted';

			if (useBackground) {
				console.log('[RecordScreen] Starting background location updates via TaskManager...');
				_onLocationUpdate = handleLocationUpdate;
				await Location.startLocationUpdatesAsync(ACTIVITY_LOCATION_TASK, {
					accuracy: Location.Accuracy.BestForNavigation,
					timeInterval: GPS_TIME_INTERVAL_MS,
					distanceInterval: GPS_DISTANCE_INTERVAL_METERS,
					showsBackgroundLocationIndicator: true,
					foregroundService: {
						notificationTitle: 'Activity Recording',
						notificationBody: 'Geonexia is recording your activity in the background.',
						notificationColor: PRIMARY_COLOR,
					},
				});
				console.log('[RecordScreen] Background location updates started.');
			} else {
				console.log('[RecordScreen] Background permission denied – falling back to foreground-only tracking.');
				const sub = await Location.watchPositionAsync(
					{
						accuracy: Location.Accuracy.BestForNavigation,
						timeInterval: GPS_TIME_INTERVAL_MS,
						distanceInterval: GPS_DISTANCE_INTERVAL_METERS,
					},
					(loc) => {
						console.log('[RecordScreen] Foreground location update:', loc.coords.latitude, loc.coords.longitude);
						handleLocationUpdate({
							lat: loc.coords.latitude,
							lng: loc.coords.longitude,
							altitude: loc.coords.altitude,
							speed: loc.coords.speed,
							timestamp: loc.timestamp,
						});
					},
				);
				fgSubRef.current = sub;
				console.log('[RecordScreen] Foreground-only watch started.');
			}
		} catch (err) {
			console.error('[RecordScreen] startRecording error:', err);
			if (err instanceof Error) {
				console.error('[RecordScreen] Error name:', err.name, '| message:', err.message);
			}
			Alert.alert('Error', 'Run recording could not be started.');
			setIsRecording(false);
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		}
	}, [handleLocationUpdate, showModal, theme]);

	const stopRecording = useCallback(async () => {
		console.log('[RecordScreen] stopRecording called.');
		_onLocationUpdate = null;
		fgSubRef.current?.remove();
		fgSubRef.current = null;

		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		try {
			const isTaskRunning = await TaskManager.isTaskRegisteredAsync(ACTIVITY_LOCATION_TASK);
			console.log('[RecordScreen] Background task running:', isTaskRunning);
			if (isTaskRunning) {
				await Location.stopLocationUpdatesAsync(ACTIVITY_LOCATION_TASK);
				console.log('[RecordScreen] Background location updates stopped.');
			}
		} catch (err) {
			console.warn('[RecordScreen] Error stopping background task:', err);
		}

		setIsRecording(false);

		const points = routePointsRef.current;
		console.log('[RecordScreen] Recorded points count:', points.length);
		if (points.length < 2) {
			Alert.alert('Run finished', 'Too few GPS points were recorded.');
			return;
		}

		const stats = computeStats(points);
		const endedAt = Date.now();

		// Save activity to persistent storage
		const activity = {
			id: String(startTimeRef.current),
			startedAt: startTimeRef.current,
			endedAt,
			routePoints: points,
			stats,
		};
		try {
			saveActivity(activity);
		} catch (err) {
			console.warn('[RecordScreen] Failed to save activity:', err);
		}

		showModal({
			title: '🏃 Run Statistics',
			onClose: closeModal,
			children: <RunStatsContent stats={stats} theme={theme} />,
		});
	}, [showModal, closeModal, theme]);

	// Compute live pace from elapsed time and distance
	const livePaceMinPerKm = liveDistanceKm > 0 ? elapsedSeconds / 60 / liveDistanceKm : null;

	if (!osmConsent) {
		return (
			<View style={styles.container}>
				<OsmConsentScreen onConsent={handleConsent} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<MyMap ref={mapRef} onMessage={handleMapMessage} injectScript={HEX_TILE_SCRIPT} />

			{/* Map overlay buttons – top-right */}
			<View style={styles.mapOverlayButtons} pointerEvents="box-none">
				<MapNorthButton mapRef={mapRef} backgroundColor="#ffffff" iconColor="#555555" />
				<View style={styles.buttonSpacer} />
				<MapLocationButton
					mapRef={mapRef}
					backgroundColor="#ffffff"
					iconColor="#555555"
					activeColor={PRIMARY_COLOR}
					isFollowing={isFollowing}
					onLocationFound={() => setFollowMode(true)}
				/>
				<View style={styles.buttonSpacer} />
				<TouchableOpacity
					style={styles.debugButton}
					onPress={showDebugModal}
					activeOpacity={0.8}
				>
					<MaterialIcons name="bug-report" size={20} color="#555555" />
				</TouchableOpacity>
			</View>

			{/* Activities button – top-left */}
			<TouchableOpacity
				style={styles.activitiesButton}
				onPress={() => router.push('/activities')}
				activeOpacity={0.8}
			>
				<MaterialIcons name="list" size={20} color="#555555" />
			</TouchableOpacity>

			{/* Start / Stop button – bottom-left */}
			<View style={styles.startStopContainer} pointerEvents="box-none">
				<TouchableOpacity
					style={[styles.startStopButton, { backgroundColor: isRecording ? '#e53935' : '#43a047' }]}
					onPress={isRecording ? stopRecording : startRecording}
					activeOpacity={0.8}
				>
					<MaterialIcons name={isRecording ? 'stop' : 'directions-run'} size={26} color="white" />
				</TouchableOpacity>
			</View>

			{/* Live stats while recording */}
			{isRecording && (
				<View
					style={[styles.liveBar, { backgroundColor: theme.screen.background + 'ee' }]}
					pointerEvents="none"
				>
					<View style={styles.liveStatCard}>
						<MaterialIcons name="straighten" size={20} color={PRIMARY_COLOR} />
						<Text style={[styles.liveStatBigValue, { color: theme.screen.text }]}>
							{liveDistanceKm < 1
								? (liveDistanceKm * 1000).toFixed(0)
								: liveDistanceKm.toFixed(2)}
						</Text>
						<Text style={[styles.liveStatUnit, { color: theme.screen.icon }]}>
							{liveDistanceKm < 1 ? 'm' : 'km'}
						</Text>
					</View>
					<View style={[styles.liveVerticalDivider, { backgroundColor: theme.screen.text + '33' }]} />
					<View style={styles.liveStatCard}>
						<MaterialIcons name="speed" size={20} color={PRIMARY_COLOR} />
						<Text style={[styles.liveStatBigValue, { color: theme.screen.text }]}>
							{livePaceMinPerKm != null ? formatPace(livePaceMinPerKm) : '--:--'}
						</Text>
						<Text style={[styles.liveStatUnit, { color: theme.screen.icon }]}>min/km</Text>
					</View>
					<View style={[styles.liveVerticalDivider, { backgroundColor: theme.screen.text + '33' }]} />
					<View style={styles.liveStatCard}>
						<MaterialIcons name="timer" size={20} color={theme.screen.icon} />
						<Text style={[styles.liveStatSmallValue, { color: theme.screen.text }]}>
							{formatDuration(elapsedSeconds)}
						</Text>
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	expoGoNoticeContainer: {
		paddingHorizontal: 20,
		paddingBottom: 12,
	},
	expoGoNoticeText: {
		fontSize: 14,
		lineHeight: 22,
	},
	mapOverlayButtons: {
		position: 'absolute',
		top: 16,
		right: 12,
		zIndex: 20,
		elevation: 20,
		alignItems: 'center',
	},
	buttonSpacer: {
		height: 8,
	},
	activitiesButton: {
		position: 'absolute',
		top: 16,
		left: 12,
		width: 36,
		height: 36,
		borderRadius: 8,
		backgroundColor: '#ffffff',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 20,
		elevation: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
	startStopContainer: {
		position: 'absolute',
		bottom: 32,
		left: 16,
		zIndex: 30,
		elevation: 30,
	},
	startStopButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.35,
		shadowRadius: 4,
		elevation: 6,
	},
	// Live stats bar
	liveBar: {
		position: 'absolute',
		bottom: 100,
		left: 8,
		right: 8,
		borderRadius: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		paddingVertical: 12,
		paddingHorizontal: 8,
		zIndex: 25,
		elevation: 25,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	liveStatCard: {
		flex: 1,
		alignItems: 'center',
		gap: 2,
	},
	liveVerticalDivider: {
		width: 1,
		height: 44,
		marginHorizontal: 4,
	},
	liveStatBigValue: {
		fontSize: 26,
		fontWeight: '700',
		letterSpacing: -0.5,
	},
	liveStatSmallValue: {
		fontSize: 18,
		fontWeight: '600',
	},
	liveStatUnit: {
		fontSize: 11,
		fontWeight: '500',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	// Consent styles
	consentContainer: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	consentIcon: {
		marginBottom: 20,
	},
	consentTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111111',
		textAlign: 'center',
		marginBottom: 14,
	},
	consentBody: {
		fontSize: 14,
		color: '#444444',
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 10,
	},
	consentBold: {
		fontWeight: '700',
	},
	consentNote: {
		fontSize: 13,
		color: '#888888',
		textAlign: 'center',
		lineHeight: 18,
		marginBottom: 28,
	},
	consentButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: PRIMARY_COLOR,
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 10,
	},
	consentButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	// Stats modal styles
	statsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	statsRowLast: {
		borderBottomWidth: 0,
	},
	statsRowIcon: {
		marginRight: 12,
	},
	statsRowLabel: {
		flex: 1,
		fontSize: 15,
	},
	statsRowValue: {
		fontSize: 15,
		fontWeight: '600',
	},
	// Debug button
	debugButton: {
		width: 36,
		height: 36,
		borderRadius: 8,
		backgroundColor: '#ffffff',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 4,
	},
	// Debug modal styles
	debugContainer: {
		paddingBottom: 12,
	},
	debugStatusBanner: {
		marginHorizontal: 16,
		marginBottom: 12,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		borderWidth: 1,
	},
	debugStatusText: {
		fontSize: 14,
		fontWeight: '600',
	},
	debugRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	debugRowLabel: {
		flex: 1,
		fontSize: 14,
	},
	debugRowValue: {
		fontSize: 14,
		fontWeight: '600',
	},
	resolutionPicker: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	resolutionButton: {
		width: 30,
		height: 30,
		borderRadius: 6,
		backgroundColor: PRIMARY_COLOR,
		alignItems: 'center',
		justifyContent: 'center',
	},
	resolutionButtonText: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '700',
		lineHeight: 22,
	},
	resolutionValue: {
		fontSize: 16,
		fontWeight: '700',
		minWidth: 24,
		textAlign: 'center',
	},
});
