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

import { deleteActivity, loadActivity, RoutePoint, SavedActivity } from '../../helpers/ActivityStorage';
import { HEX_TILE_SCRIPT } from '../../assets/hexTileScript';

const AUTO_ROTATE_TICK_MS = 100;
const AUTO_ROTATE_SPEED_DEG_PER_S = 5; // slow rotation for activity view

const PRIMARY_COLOR = '#2563eb';

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

		// Calculate bounds from all route points and fit the camera
		const points = activity.routePoints;
		if (points.length >= 2) {
			const lats = points.map((p) => p.lat);
			const lngs = points.map((p) => p.lng);
			const minLat = Math.min(...lats);
			const maxLat = Math.max(...lats);
			const minLng = Math.min(...lngs);
			const maxLng = Math.max(...lngs);
			const centerLat = (minLat + maxLat) / 2;
			const centerLng = (minLng + maxLng) / 2;
			routeCenterRef.current = { lat: centerLat, lng: centerLng };
			// Expand the bounding box to 1.5× the route span so the route is
			// not clipped at the edges (adds 25 % padding on every side).
			const latSpan = maxLat - minLat;
			const lngSpan = maxLng - minLng;
			const latPad = latSpan * 0.25;
			const lngPad = lngSpan * 0.25;
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

		// Start slow auto-rotate, keeping the camera anchored on the route centre
		autoRotateBearingRef.current = 0;
		autoRotateActiveRef.current = true;
		if (autoRotateIntervalRef.current !== null) {
			clearInterval(autoRotateIntervalRef.current);
		}
		autoRotateIntervalRef.current = setInterval(() => {
			if (!autoRotateActiveRef.current || !mapRef.current) return;
			const deltaDeg = AUTO_ROTATE_SPEED_DEG_PER_S * (AUTO_ROTATE_TICK_MS / 1000);
			autoRotateBearingRef.current = (autoRotateBearingRef.current + deltaDeg) % 360;
			const center = routeCenterRef.current;
			mapRef.current.sendToMap({
				bearing: autoRotateBearingRef.current,
				...(center ? { mapCenterPosition: center } : {}),
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
	}, [mapMounted, activity, buildRouteSegments]);
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
				<MyMap ref={mapRef} onMessage={handleMapMessage} injectScript={HEX_TILE_SCRIPT} centerAtUserLocationIfNoInitialPosition={false} />
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
});
