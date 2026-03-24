import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { MyMap, MyMapHandle, QrCode, SettingsList, useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';

import { loadActivity, SavedActivity } from '../../helpers/ActivityStorage';
import { HEX_TILE_SCRIPT } from '../../assets/hexTileScript';

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

// ─── Activity Detail Screen ───────────────────────────────────────────────────

export default function ActivityDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { theme } = useTheme();
	const router = useRouter();
	const { show: showShareModal } = useMyScrollViewModal();
	const mapRef = useRef<MyMapHandle>(null);
	const [activity, setActivity] = useState<SavedActivity | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [mapMounted, setMapMounted] = useState(false);

	useEffect(() => {
		if (!id) { setNotFound(true); return; }
		loadActivity(id)
			.then((a) => {
				if (!a) { setNotFound(true); return; }
				setActivity(a);
			})
			.catch(() => setNotFound(true));
	}, [id]);

	// Once both activity and map are ready, send the route
	useEffect(() => {
		if (!mapMounted || !activity || !mapRef.current) return;
		const coords = activity.routePoints.map((p) => [p.lng, p.lat]);
		mapRef.current.sendToMap({ routeCoordinates: coords });

		// Center the map on the first route point if available
		const first = activity.routePoints[0];
		if (first) {
			mapRef.current.sendToMap({
				mapCenterPosition: { lat: first.lat, lng: first.lng },
			});
		}
	}, [mapMounted, activity]);

	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			setMapMounted(true);
		}
	}, []);

	const handleShare = useCallback(() => {
		if (!activity) return;
		showShareModal({
			title: '📤 Share Activity',
			children: <ShareContent activity={activity} theme={theme} />,
		});
	}, [activity, showShareModal, theme]);

	if (notFound) {
		return (
			<View style={[styles.centeredContainer, { backgroundColor: theme.screen.background }]}>
				<MaterialIcons name="error-outline" size={48} color={theme.screen.icon} />
				<Text style={[styles.notFoundText, { color: theme.screen.text }]}>Activity not found.</Text>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			{/* Map – top 1/3 */}
			<View style={styles.mapContainer}>
				<MyMap ref={mapRef} onMessage={handleMapMessage} injectScript={HEX_TILE_SCRIPT} />
			</View>

			{/* Stats – scrollable bottom 2/3 */}
			<ScrollView
				style={styles.statsScroll}
				contentContainerStyle={styles.statsContent}
				showsVerticalScrollIndicator={false}
			>
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
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	mapContainer: {
		flex: 1,
	},
	statsScroll: {
		flex: 2,
	},
	statsContent: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 24,
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
