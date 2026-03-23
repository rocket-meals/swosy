import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MapLocationButton, MapNorthButton, MyMap, MyMapHandle, useTheme } from 'repo-depkit-common-ui';

const PRIMARY_COLOR = '#2563eb';

// ─── Types ────────────────────────────────────────────────────────────────────

type RoutePoint = {
	lat: number;
	lng: number;
	altitude: number | null;
	speed: number | null;
	timestamp: number;
};

type RunStats = {
	distanceKm: number;
	durationSeconds: number;
	paceMinPerKm: number;
	maxSpeedKmh: number;
	minSpeedKmh: number;
	avgSpeedKmh: number;
	kcal: number;
	steps: number;
	elevationGainM: number;
	elevationLossM: number;
	fluidNeedsMl: number;
};

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

TaskManager.defineTask(ACTIVITY_LOCATION_TASK, ({ data, error }: TaskManager.TaskManagerTaskBody) => {
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
	return `${m}:${String(s).padStart(2, '0')} min/km`;
}

function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)} m`;
	return `${km.toFixed(2)} km`;
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
				You can reset your consent at any time by restarting the app or navigating away from this screen.
			</Text>
			<TouchableOpacity style={styles.consentButton} onPress={onConsent} activeOpacity={0.8}>
				<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
				<Text style={styles.consentButtonText}>Load map data (Accept)</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

// ─── Run Stats Modal ──────────────────────────────────────────────────────────

type RunStatsModalProps = {
	visible: boolean;
	stats: RunStats | null;
	onClose: () => void;
};

function RunStatsModal({ visible, stats, onClose }: RunStatsModalProps) {
	const { theme } = useTheme();

	if (!stats) return null;

	const rows: { iconName: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }[] = [
		{ iconName: 'straighten', label: 'Distance', value: formatDistance(stats.distanceKm) },
		{ iconName: 'timer', label: 'Duration', value: formatDuration(stats.durationSeconds) },
		{ iconName: 'speed', label: 'Pace', value: formatPace(stats.paceMinPerKm) },
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
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<View style={[styles.modalSheet, { backgroundColor: theme.screen.background }]}>
					<View style={styles.modalHeader}>
						<Text style={[styles.modalTitle, { color: theme.screen.text }]}>🏃 Run Statistics</Text>
						<TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
							<Ionicons name="close" size={24} color={theme.screen.icon} />
						</TouchableOpacity>
					</View>
					<ScrollView>
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
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}

// ─── Activity Screen ──────────────────────────────────────────────────────────

export default function ActivityScreen() {
	const { theme } = useTheme();
	const [osmConsent, setOsmConsent] = useState(false);
	const mapRef = useRef<MyMapHandle>(null);

	const [isRecording, setIsRecording] = useState(false);
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [liveDistanceKm, setLiveDistanceKm] = useState(0);
	const [liveSpeedKmh, setLiveSpeedKmh] = useState<number | null>(null);
	const [finishedStats, setFinishedStats] = useState<RunStats | null>(null);
	const [statsVisible, setStatsVisible] = useState(false);

	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef<number>(0);
	const routePointsRef = useRef<RoutePoint[]>([]);
	// Foreground-only fallback subscription (used when background permission is denied)
	const fgSubRef = useRef<Location.LocationSubscription | null>(null);

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
	}, []);

	const sendRouteToMap = useCallback((points: RoutePoint[]) => {
		if (!mapRef.current) return;
		const coords = points.map((p) => [p.lng, p.lat]);
		mapRef.current.sendToMap({ routeCoordinates: coords });
	}, []);

	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			mapRef.current?.sendToMap({ hexTileLayer: { spacingMeters: 100 } });
			// Re-send route if already recording when map (re)loads
			if (routePointsRef.current.length > 0) {
				sendRouteToMap(routePointsRef.current);
			}
		}
	}, [sendRouteToMap]);

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
	}, [sendRouteToMap]);

	const startRecording = useCallback(async () => {
		try {
			const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
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

			// Try to request background permission; fall back to foreground-only if denied.
			const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
			const useBackground = bgStatus === 'granted';

			if (useBackground) {
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
			} else {
				// Foreground-only fallback
				const sub = await Location.watchPositionAsync(
					{
						accuracy: Location.Accuracy.BestForNavigation,
						timeInterval: GPS_TIME_INTERVAL_MS,
						distanceInterval: GPS_DISTANCE_INTERVAL_METERS,
					},
					(loc) => {
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
			}
		} catch (err) {
			console.error('ActivityScreen startRecording error:', err);
			Alert.alert('Error', 'Run recording could not be started.');
			setIsRecording(false);
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		}
	}, [handleLocationUpdate]);

	const stopRecording = useCallback(async () => {
		_onLocationUpdate = null;
		fgSubRef.current?.remove();
		fgSubRef.current = null;

		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		try {
			const isTaskRunning = await TaskManager.isTaskRegisteredAsync(ACTIVITY_LOCATION_TASK);
			if (isTaskRunning) {
				await Location.stopLocationUpdatesAsync(ACTIVITY_LOCATION_TASK);
			}
		} catch {
			// Ignore errors when stopping task
		}

		setIsRecording(false);

		const points = routePointsRef.current;
		if (points.length < 2) {
			Alert.alert('Run finished', 'Too few GPS points were recorded.');
			return;
		}

		const stats = computeStats(points);
		setFinishedStats(stats);
		setStatsVisible(true);
	}, []);

	if (!osmConsent) {
		return (
			<View style={styles.container}>
				<OsmConsentScreen onConsent={handleConsent} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<MyMap ref={mapRef} onMessage={handleMapMessage} />

			{/* Map overlay buttons – top-right */}
			<View style={styles.mapOverlayButtons} pointerEvents="box-none">
				<MapNorthButton mapRef={mapRef} backgroundColor="#ffffff" iconColor="#555555" />
				<View style={styles.buttonSpacer} />
				<MapLocationButton
					mapRef={mapRef}
					backgroundColor="#ffffff"
					iconColor="#555555"
					activeColor={PRIMARY_COLOR}
				/>
			</View>

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

			{/* Live stats bar while recording */}
			{isRecording && (
				<View
					style={[styles.liveBar, { backgroundColor: theme.screen.background + 'ee' }]}
					pointerEvents="none"
				>
					<View style={styles.liveStatItem}>
						<MaterialIcons name="timer" size={14} color={theme.screen.icon} />
						<Text style={[styles.liveStatValue, { color: theme.screen.text }]}>
							{formatDuration(elapsedSeconds)}
						</Text>
					</View>
					<View style={[styles.liveDivider, { backgroundColor: theme.screen.text + '44' }]} />
					<View style={styles.liveStatItem}>
						<MaterialIcons name="straighten" size={14} color={theme.screen.icon} />
						<Text style={[styles.liveStatValue, { color: theme.screen.text }]}>
							{formatDistance(liveDistanceKm)}
						</Text>
					</View>
					<View style={[styles.liveDivider, { backgroundColor: theme.screen.text + '44' }]} />
					<View style={styles.liveStatItem}>
						<MaterialIcons name="speed" size={14} color={theme.screen.icon} />
						<Text style={[styles.liveStatValue, { color: theme.screen.text }]}>
							{liveSpeedKmh != null ? `${liveSpeedKmh.toFixed(1)} km/h` : '-- km/h'}
						</Text>
					</View>
				</View>
			)}

			<RunStatsModal
				visible={statsVisible}
				stats={finishedStats}
				onClose={() => setStatsVisible(false)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
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
	startStopContainer: {
		position: 'absolute',
		bottom: 32,
		left: 16,
		zIndex: 30,
		elevation: 30,
	},
	startStopButton: {
		width: 52,
		height: 52,
		borderRadius: 26,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.35,
		shadowRadius: 4,
		elevation: 6,
	},
	liveBar: {
		position: 'absolute',
		bottom: 92,
		left: 8,
		right: 8,
		borderRadius: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		paddingVertical: 8,
		paddingHorizontal: 12,
		zIndex: 25,
		elevation: 25,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
	},
	liveStatItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	liveStatValue: {
		fontSize: 13,
		fontWeight: '600',
	},
	liveDivider: {
		width: 1,
		height: 16,
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
	modalOverlay: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: '#00000055',
	},
	modalSheet: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		maxHeight: '80%',
		paddingBottom: 32,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#00000022',
	},
	modalTitle: {
		fontSize: 17,
		fontWeight: '700',
	},
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
});
