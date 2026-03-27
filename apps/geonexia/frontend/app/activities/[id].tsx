import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MyMap, MyMapHandle, QrCode, SettingsList, useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';

import { deleteActivity, loadActivity, RoutePoint, RunStats, saveActivity, SavedActivity } from '../../helpers/ActivityStorage';
import { HEX_TILE_SCRIPT } from '../../assets/hexTileScript';
import { SPORT_TYPES } from '../../store/sportTypeSlice';

const AUTO_ROTATE_TICK_MS = 100;
const AUTO_ROTATE_SPEED_DEG_PER_S = 5; // slow rotation for activity view

const PRIMARY_COLOR = '#2563eb';

// ─── Stats / filter helpers ───────────────────────────────────────────────────

const DEFAULT_RUNNER_WEIGHT_KG = 75;
const KCAL_PER_KG_PER_KM = 0.9;
const AVERAGE_STRIDE_LENGTH_METERS = 0.77;
const FLUID_BASELINE_DURATION_SECONDS = 3600;
const FLUID_BASELINE_ML = 600;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Remove GPS points that imply an unrealistic speed relative to the last
 * accepted point.  Only the offending candidate is dropped; the previous
 * accepted point keeps serving as the reference for subsequent candidates.
 * Example: A→B ok, B→C 400 km/h → C removed, B→D 300 km/h → D removed,
 * B→E 10 km/h → E kept; now E is the new reference.
 */
function filterUnrealisticPoints(points: RoutePoint[], maxSpeedKmh: number): RoutePoint[] {
	if (points.length < 2) return [...points];
	const result: RoutePoint[] = [points[0]];
	let lastAccepted = points[0];
	for (let i = 1; i < points.length; i++) {
		const candidate = points[i];
		const distKm = haversineKm(lastAccepted.lat, lastAccepted.lng, candidate.lat, candidate.lng);
		const dtHours = (candidate.timestamp - lastAccepted.timestamp) / 3_600_000;
		const speedKmh = dtHours > 0 ? distKm / dtHours : 0;
		if (speedKmh <= maxSpeedKmh) {
			result.push(candidate);
			lastAccepted = candidate;
		}
		// else: candidate is unrealistic – skip it, keep lastAccepted as reference
	}
	return result;
}

function computeActivityStats(points: RoutePoint[]): RunStats {
	if (points.length < 2) {
		const durationSeconds = points.length === 1 ? (Date.now() - points[0].timestamp) / 1000 : 0;
		return {
			distanceKm: 0, durationSeconds, paceMinPerKm: 0,
			maxSpeedKmh: 0, minSpeedKmh: 0, avgSpeedKmh: 0,
			kcal: 0, steps: 0, elevationGainM: 0, elevationLossM: 0, fluidNeedsMl: 0,
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
		distanceKm, durationSeconds, paceMinPerKm,
		maxSpeedKmh, minSpeedKmh, avgSpeedKmh,
		kcal, steps, elevationGainM, elevationLossM, fluidNeedsMl,
	};
}

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString(undefined, {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatDuration(totalSeconds: number): string {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = Math.floor(totalSeconds % 60);
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)} m`;
	return `${km.toFixed(2)} km`;
}

function formatPace(minPerKm: number): string {
	if (minPerKm <= 0 || !isFinite(minPerKm)) return '--:--';
	const m = Math.floor(minPerKm);
	const s = Math.round((minPerKm - m) * 60);
	return `${m}:${String(s).padStart(2, '0')} min/km`;
}

// ─── Share Content (shown inside bottom sheet modal) ──────────────────────────

const QR_MAX_BYTES = 2953;

function ShareContent({ activity, theme }: { activity: SavedActivity; theme: ReturnType<typeof useTheme>['theme'] }) {
	const compact = JSON.stringify(activity);
	const pretty = JSON.stringify(activity, null, 2);
	const showQr = compact.length <= QR_MAX_BYTES;

	const handleCopy = useCallback(async () => {
		await Clipboard.setStringAsync(compact);
		Alert.alert('Copied', 'Activity data copied to clipboard.');
	}, [compact]);

	return (
		<View>
			<ScrollView
				horizontal
				style={styles.shareCodeScroll}
				contentContainerStyle={styles.shareCodeContent}
				showsHorizontalScrollIndicator={false}
			>
				<Text style={[styles.shareCodeText, { color: theme.screen.text }]} selectable>
					{pretty}
				</Text>
			</ScrollView>
			<TouchableOpacity style={[styles.shareButton, { backgroundColor: PRIMARY_COLOR }]} onPress={handleCopy} activeOpacity={0.8}>
				<MaterialIcons name="content-copy" size={18} color="#ffffff" />
				<Text style={styles.shareButtonText}>Copy JSON</Text>
			</TouchableOpacity>
			{showQr && (
				<View style={styles.shareQrContainer}>
					<QrCode value={compact} size={220} />
				</View>
			)}
			{!showQr && (
				<Text style={[styles.shareQrHint, { color: theme.screen.text + '88' }]}>
					QR code not available – activity data exceeds size limit. Use "Copy JSON" instead.
				</Text>
			)}
		</View>
	);
}

// ─── Delete Confirm Content (shown inside bottom sheet modal) ─────────────────

function DeleteConfirmContent({
	onConfirm,
	onCancel,
	theme,
}: {
	onConfirm: () => void;
	onCancel: () => void;
	theme: ReturnType<typeof useTheme>['theme'];
}) {
	return (
		<View style={styles.deleteConfirmContainer}>
			<Text style={[styles.deleteConfirmText, { color: theme.screen.text }]}>
				Are you sure you want to delete this activity? This action cannot be undone.
			</Text>
			<TouchableOpacity
				style={[styles.shareButton, { backgroundColor: '#ef4444' }]}
				onPress={onConfirm}
				activeOpacity={0.8}
			>
				<MaterialIcons name="delete" size={18} color="#ffffff" />
				<Text style={styles.shareButtonText}>Delete</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
				<Text style={[styles.cancelButtonText, { color: theme.screen.text }]}>Cancel</Text>
			</TouchableOpacity>
		</View>
	);
}

// ─── Activity Detail Screen ───────────────────────────────────────────────────

export default function ActivityDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { theme } = useTheme();
	const router = useRouter();
	const navigation = useNavigation();
	const { show: showShareModal, close: closeModal } = useMyScrollViewModal();
	const mapRef = useRef<MyMapHandle>(null);
	const [activity, setActivity] = useState<SavedActivity | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [mapMounted, setMapMounted] = useState(false);
	const autoRotateBearingRef = useRef(0);
	const autoRotateActiveRef = useRef(false);
	const autoRotateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const routeCenterRef = useRef<{ lat: number; lng: number } | null>(null);

	// Clean up auto-rotate interval on unmount
	useEffect(() => {
		return () => {
			if (autoRotateIntervalRef.current !== null) {
				clearInterval(autoRotateIntervalRef.current);
			}
		};
	}, []);

	// Show back arrow instead of drawer hamburger; use theme colors so it stays
	// visible in both light and dark mode.
	useLayoutEffect(() => {
		navigation.setOptions({
			headerStyle: { backgroundColor: theme.header.background },
			headerTintColor: theme.header.text,
			headerLeft: () => (
				<TouchableOpacity
					onPress={() => router.navigate('/activities')}
					style={styles.headerBackButton}
					activeOpacity={0.7}
				>
					<MaterialIcons name="arrow-back" size={24} color={theme.header.text} />
				</TouchableOpacity>
			),
		});
	}, [navigation, router, theme.header.background, theme.header.text]);

	useEffect(() => {
		if (!id) { setNotFound(true); return; }
		loadActivity(id)
			.then((a) => {
				if (!a) { setNotFound(true); return; }
				setActivity(a);
			})
			.catch(() => setNotFound(true));
	}, [id]);

	// Build speed-colored segments from route points
	const buildRouteSegments = useCallback((points: RoutePoint[]) => {
		if (points.length < 2) return null;
		const segments = [];
		for (let i = 0; i < points.length - 1; i++) {
			const a = points[i];
			const b = points[i + 1];
			// Average speed of the two endpoints; * 3.6 converts m/s → km/h
		const speedKmh = (((a.speed ?? 0) + (b.speed ?? 0)) / 2) * 3.6;
			segments.push({ coords: [[a.lng, a.lat], [b.lng, b.lat]], speedKmh });
		}
		return segments;
	}, []);

	// Compute the bounding box of a route using a loop (avoids spread-operator stack
	// overflow for routes with thousands of GPS points).
	const computeRouteBounds = useCallback((points: RoutePoint[]) => {
		if (points.length === 0) return null;
		let minLat = points[0].lat;
		let maxLat = points[0].lat;
		let minLng = points[0].lng;
		let maxLng = points[0].lng;
		for (const p of points) {
			if (p.lat < minLat) minLat = p.lat;
			if (p.lat > maxLat) maxLat = p.lat;
			if (p.lng < minLng) minLng = p.lng;
			if (p.lng > maxLng) maxLng = p.lng;
		}
		return { minLat, maxLat, minLng, maxLng };
	}, []);

	// Once both activity and map are ready, send the route with speed segments
	useEffect(() => {
		if (!mapMounted || !activity || !mapRef.current) return;
		const segments = buildRouteSegments(activity.routePoints);
		if (segments && segments.length > 0) {
			mapRef.current.sendToMap({ routeSegments: segments });
		} else {
			// Fallback: plain route without speed coloring
			const coords = activity.routePoints.map((p) => [p.lng, p.lat]);
			mapRef.current.sendToMap({ routeCoordinates: coords });
		}

		// Fit the camera to the full route extent
		const points = activity.routePoints;
		if (points.length >= 2) {
			const bounds = computeRouteBounds(points)!;
			const { minLat, maxLat, minLng, maxLng } = bounds;
			routeCenterRef.current = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
			// Expand the bounding box to 1.5× the route span so the route is
			// not clipped at the edges (adds 25 % padding on every side).
			const latPad = (maxLat - minLat) * 0.25;
			const lngPad = (maxLng - minLng) * 0.25;
			mapRef.current.sendToMap({
				fitBounds: [[minLng - lngPad, minLat - latPad], [maxLng + lngPad, maxLat + latPad]],
				fitBoundsPadding: 20,
				pitch: 45,
				bearing: 0,
			});
		} else if (points.length === 1) {
			routeCenterRef.current = { lat: points[0].lat, lng: points[0].lng };
			mapRef.current.sendToMap({
				mapCenterPosition: { lat: points[0].lat, lng: points[0].lng },
				pitch: 45,
				bearing: 0,
			});
		}

		// Start slow auto-rotate after the fitBounds animation finishes.
		// fitBounds sets pitch=45 and the correct zoom; starting the interval
		// immediately would call easeTo within 100 ms and cancel that animation,
		// locking in the wrong pitch/zoom. Waiting ~1200 ms lets fitBounds
		// complete before we begin rotating.
		// We only update bearing (no mapCenterPosition) so that zoom and pitch
		// established by fitBounds are never overwritten by the interval ticks.
		autoRotateBearingRef.current = 0;
		autoRotateActiveRef.current = true;
		if (autoRotateIntervalRef.current !== null) {
			clearInterval(autoRotateIntervalRef.current);
		}
		const FIT_BOUNDS_ANIMATION_DELAY_MS = 1200;
		let startDelayTicks = Math.ceil(FIT_BOUNDS_ANIMATION_DELAY_MS / AUTO_ROTATE_TICK_MS);
		autoRotateIntervalRef.current = setInterval(() => {
			if (startDelayTicks > 0) { startDelayTicks -= 1; return; }
			if (!autoRotateActiveRef.current || !mapRef.current) return;
			const deltaDeg = AUTO_ROTATE_SPEED_DEG_PER_S * (AUTO_ROTATE_TICK_MS / 1000);
			autoRotateBearingRef.current = (autoRotateBearingRef.current + deltaDeg) % 360;
			mapRef.current.sendToMap({
				bearing: autoRotateBearingRef.current,
				easeAnimation: true,
				easeDuration: AUTO_ROTATE_TICK_MS,
			});
		}, AUTO_ROTATE_TICK_MS);

		return () => {
			if (autoRotateIntervalRef.current !== null) {
				clearInterval(autoRotateIntervalRef.current);
				autoRotateIntervalRef.current = null;
			}
			autoRotateActiveRef.current = false;
		};
	}, [mapMounted, activity, buildRouteSegments, computeRouteBounds]);
	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			setMapMounted(true);
		} else if (msg.tag === 'MapInteracted') {
			// Stop auto-rotate when user interacts with the map
			autoRotateActiveRef.current = false;
			if (autoRotateIntervalRef.current !== null) {
				clearInterval(autoRotateIntervalRef.current);
				autoRotateIntervalRef.current = null;
			}
		}
	}, []);

	const handleFilterUnrealisticPoints = useCallback(() => {
		if (!activity) return;
		const sportDef = SPORT_TYPES.find((s) => s.type === activity.sportType);
		const maxSpeed = sportDef?.maxSpeedKmh ?? 90;
		const sportLabel = sportDef?.label ?? 'Default';
		Alert.alert(
			'Filter unrealistic Points',
			`Remove GPS points that imply a speed above ${maxSpeed} km/h (${sportLabel} limit)?\n\nThis will permanently update the saved activity.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Filter',
					onPress: () => {
						const filtered = filterUnrealisticPoints(activity.routePoints, maxSpeed);
						const removedCount = activity.routePoints.length - filtered.length;
						const newStats = computeActivityStats(filtered);
						const updated: SavedActivity = { ...activity, routePoints: filtered, stats: newStats };
						saveActivity(updated);
						setActivity(updated);
						Alert.alert(
							'Done',
							removedCount > 0
								? `Removed ${removedCount} unrealistic point${removedCount !== 1 ? 's' : ''}.`
								: 'No unrealistic points found.',
						);
					},
				},
			],
		);
	}, [activity]);

	const handleShare = useCallback(() => {
		if (!activity) return;
		showShareModal({
			title: '📤 Share Activity',
			children: <ShareContent activity={activity} theme={theme} />,
		});
	}, [activity, showShareModal, theme]);

	const handleDelete = useCallback(() => {
		if (!activity) return;
		showShareModal({
			title: '🗑️ Delete Activity',
			children: (
				<DeleteConfirmContent
					onConfirm={() => {
						deleteActivity(activity.id);
						closeModal();
						router.back();
					}}
					onCancel={closeModal}
					theme={theme}
				/>
			),
		});
	}, [activity, showShareModal, closeModal, router, theme]);

	if (notFound) {
		return (
			<View style={[styles.centeredContainer, { backgroundColor: theme.screen.background }]}>
				<MaterialIcons name="error-outline" size={48} color={theme.screen.icon} />
				<Text style={[styles.notFoundText, { color: theme.screen.text }]}>Activity not found.</Text>
				<TouchableOpacity style={styles.backButton} onPress={() => router.navigate('/activities')}>
					<Text style={styles.backButtonText}>Go back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (!activity) {
		return (
			<View style={[styles.centeredContainer, { backgroundColor: theme.screen.background }]}>
				<Text style={[styles.loadingText, { color: theme.screen.icon }]}>Loading…</Text>
			</View>
		);
	}

	const { stats } = activity;

	// Compute the route centre so the map starts at the correct position immediately.
	const routeInitialCenter = (() => {
		const bounds = computeRouteBounds(activity.routePoints);
		if (!bounds) return undefined;
		return { lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 };
	})();

	const statsRows: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }[] = [
		{ icon: 'event', label: 'Date', value: formatDate(activity.startedAt) },
		{ icon: 'access-time', label: 'Start Time', value: formatTime(activity.startedAt) },
		{ icon: 'access-time', label: 'End Time', value: formatTime(activity.endedAt) },
		{ icon: 'straighten', label: 'Distance', value: formatDistance(stats.distanceKm) },
		{ icon: 'timer', label: 'Duration', value: formatDuration(stats.durationSeconds) },
		{ icon: 'speed', label: 'Pace', value: formatPace(stats.paceMinPerKm) },
		{ icon: 'speed', label: 'Avg. Speed', value: `${stats.avgSpeedKmh.toFixed(1)} km/h` },
		{ icon: 'arrow-upward', label: 'Max. Speed', value: `${stats.maxSpeedKmh.toFixed(1)} km/h` },
		{ icon: 'arrow-downward', label: 'Min. Speed', value: `${stats.minSpeedKmh.toFixed(1)} km/h` },
		{ icon: 'local-fire-department', label: 'Calories', value: `${stats.kcal} kcal` },
		{ icon: 'directions-walk', label: 'Steps (est.)', value: stats.steps.toLocaleString() },
		{ icon: 'trending-up', label: 'Elevation Gain', value: `${Math.round(stats.elevationGainM)} m` },
		{ icon: 'trending-down', label: 'Elevation Loss', value: `${Math.round(stats.elevationLossM)} m` },
		{ icon: 'water-drop', label: 'Fluid Needs', value: `${stats.fluidNeedsMl} ml` },
		{ icon: 'place', label: 'GPS Points', value: String(activity.routePoints.length) },
	];

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			{/* Map – 1:1 square at the top */}
			<View style={styles.mapContainer}>
				<MyMap ref={mapRef} onMessage={handleMapMessage} injectScript={HEX_TILE_SCRIPT} centerAtUserLocationIfNoInitialPosition={false} initialCenter={routeInitialCenter} initialPitch={45} />
			</View>

			{/* Stats list */}
			<View style={styles.statsContent}>
				{statsRows.map((row, index) => (
					<SettingsList
						key={row.label}
						leftIcon={<MaterialIcons name={row.icon} size={20} color="#ffffff" />}
						iconBackgroundColor={PRIMARY_COLOR}
						title={row.label}
						value={row.value}
						showSeparator={index < statsRows.length - 1}
						groupPosition={
							index === 0
								? 'top'
								: index === statsRows.length - 1
								? 'bottom'
								: 'middle'
						}
					/>
				))}
				<View style={styles.filterRow}>
					<SettingsList
						leftIcon={<MaterialIcons name="filter-list" size={20} color="#ffffff" />}
						iconBackgroundColor="#f59e0b"
						title="Filter unrealistic Points"
						groupPosition="single"
						onPress={handleFilterUnrealisticPoints}
					/>
				</View>
				<TouchableOpacity style={[styles.shareButton, { backgroundColor: PRIMARY_COLOR }]} onPress={handleShare} activeOpacity={0.8}>
					<MaterialIcons name="share" size={18} color="#ffffff" />
					<Text style={styles.shareButtonText}>Share Activity</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.deleteButton]} onPress={handleDelete} activeOpacity={0.8}>
					<MaterialIcons name="delete-outline" size={18} color="#ef4444" />
					<Text style={styles.deleteButtonText}>Delete Activity</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	mapContainer: {
		width: '100%',
		aspectRatio: 1,
	},
	statsContent: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 32,
	},
	centeredContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 24,
	},
	notFoundText: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
	},
	loadingText: {
		fontSize: 15,
	},
	backButton: {
		marginTop: 8,
		backgroundColor: PRIMARY_COLOR,
		paddingVertical: 10,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	backButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	headerBackButton: {
		marginLeft: 8,
		padding: 4,
	},
	shareButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
		marginBottom: 8,
		paddingVertical: 12,
		borderRadius: 10,
		gap: 8,
	},
	shareButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 4,
		marginBottom: 8,
		paddingVertical: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#ef4444',
		gap: 8,
	},
	deleteButtonText: {
		color: '#ef4444',
		fontSize: 15,
		fontWeight: '600',
	},
	deleteConfirmContainer: {
		paddingTop: 8,
		gap: 4,
	},
	deleteConfirmText: {
		fontSize: 15,
		lineHeight: 22,
		marginBottom: 8,
	},
	cancelButton: {
		alignItems: 'center',
		paddingVertical: 12,
		borderRadius: 10,
	},
	cancelButtonText: {
		fontSize: 15,
		fontWeight: '500',
	},
	shareCodeScroll: {
		maxHeight: 200,
		marginHorizontal: 16,
		marginTop: 12,
	},
	shareCodeContent: {
		paddingBottom: 8,
	},
	shareCodeText: {
		fontFamily: 'monospace',
		fontSize: 12,
	},
	shareQrContainer: {
		alignItems: 'center',
		marginTop: 12,
		marginBottom: 8,
	},
	shareQrHint: {
		fontSize: 13,
		textAlign: 'center',
		marginHorizontal: 16,
		marginTop: 8,
		marginBottom: 8,
	},
	filterRow: {
		marginTop: 16,
	},
});
