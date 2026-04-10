import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
	MyMap,
	MyMapHandle,
	SettingsListBoolean,
	SettingsListGroupTitle,
	useTheme,
} from 'repo-depkit-common-ui';
import { useFocusEffect } from 'expo-router';

import {
	loadActivities,
	RoutePoint,
	SavedActivity,
} from '../../../helpers/ActivityStorage';
import { HEX_TILE_SCRIPT } from '../../../assets/hexTileScript';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_COLOR = '#0d9488'; // teal

// Smoothing window for the snap-to-road projection algorithm (number of neighbours)
const SNAP_SMOOTH_WINDOW = 9;

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatActivityLabel(activity: SavedActivity): string {
	const d = new Date(activity.startedAt);
	const date = d.toLocaleDateString(undefined, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
	const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	const km = activity.stats.distanceKm;
	const distStr = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`;
	return `${date} ${time}  ·  ${distStr}`;
}

// Euclidean distance in degrees (good enough for small distances)
function deg2(a: [number, number], b: [number, number]): number {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	return dx * dx + dy * dy;
}

// ─── Route bounds ─────────────────────────────────────────────────────────────

function computeRouteBounds(points: RoutePoint[]) {
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
}

// ─── Moving-average smoothing ─────────────────────────────────────────────────

function movingAverage(coords: [number, number][], window: number): [number, number][] {
	const half = Math.floor(window / 2);
	return coords.map((_, i) => {
		const lo = Math.max(0, i - half);
		const hi = Math.min(coords.length - 1, i + half);
		let sumLng = 0;
		let sumLat = 0;
		let n = 0;
		for (let j = lo; j <= hi; j++) {
			sumLng += coords[j][0];
			sumLat += coords[j][1];
			n++;
		}
		return [sumLng / n, sumLat / n];
	});
}

// ─── Road-snap algorithm ──────────────────────────────────────────────────────
//
// Approximates "road snapping" by:
//   1. Building a smoothed centre-line of the GPS track (moving average).
//   2. Projecting each raw GPS point onto the nearest segment of that
//      smoothed track.

function projectOntoSegment(
	p: [number, number],
	a: [number, number],
	b: [number, number],
): [number, number] {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) return a;
	const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq));
	return [a[0] + t * dx, a[1] + t * dy];
}

function snapToRoad(
	coords: [number, number][],
	interpolatedMask?: boolean[],
): [number, number][] {
	if (coords.length < 2) return coords;

	// Build smoothed centre-line from all points
	const smoothed = movingAverage(coords, SNAP_SMOOTH_WINDOW);

	// Project each raw point onto the nearest smoothed segment.
	// Interpolated points are left unchanged.
	return coords.map((pt, i) => {
		if (interpolatedMask && interpolatedMask.length === coords.length && interpolatedMask[i])
			return pt;
		let bestDistSq = Infinity;
		let bestPt: [number, number] = pt;
		for (let j = 0; j < smoothed.length - 1; j++) {
			const proj = projectOntoSegment(pt, smoothed[j], smoothed[j + 1]);
			const d = deg2(pt, proj);
			if (d < bestDistSq) {
				bestDistSq = d;
				bestPt = proj;
			}
		}
		return bestPt;
	});
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RoadSnapScreen() {
	const { theme } = useTheme();
	const mapRef = useRef<MyMapHandle>(null);

	const [mapKey, setMapKey] = useState(0);
	const [mapMounted, setMapMounted] = useState(false);
	const [activities, setActivities] = useState<SavedActivity[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedActivity, setSelectedActivity] = useState<SavedActivity | null>(null);
	const [activityPickerOpen, setActivityPickerOpen] = useState(false);

	// ── Processing toggle ─────────────────────────────────────────────────────
	const [snapEnabled, setSnapEnabled] = useState(false);

	// Initial map centre derived from the selected activity's bounding box
	const routeInitialCenter = useMemo(() => {
		if (!selectedActivity) return undefined;
		const bounds = computeRouteBounds(selectedActivity.routePoints);
		if (!bounds) return undefined;
		return { lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 };
	}, [selectedActivity]);

	// Load activities on mount
	useEffect(() => {
		loadActivities()
			.then((acts) => {
				setActivities(acts);
				if (acts.length > 0) setSelectedActivity(acts[0]);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	// Remount the map whenever the selected activity changes so that
	// initialCenter takes effect immediately (same behaviour as activities/[id]).
	const selectedActivityId = selectedActivity?.id;
	useEffect(() => {
		setMapMounted(false);
		setMapKey((k) => k + 1);
	}, [selectedActivityId]);

	// Clean up when screen loses focus
	useFocusEffect(
		useCallback(() => {
			return () => {
				setMapMounted(false);
				setMapKey((k) => k + 1);
			};
		}, []),
	);

	// Build and send processed coordinates to the map
	const sendRouteToMap = useCallback(
		(activity: SavedActivity | null, snap: boolean) => {
			if (!mapRef.current || !activity) return;

			const coords: [number, number][] = activity.routePoints.map((p: RoutePoint) => [
				p.lng,
				p.lat,
			]);
			if (coords.length === 0) return;

			// Show raw GPS points as small markers for comparison
			mapRef.current.sendToMap({
				debugGpsPoints: activity.routePoints.map((p: RoutePoint) => [p.lng, p.lat]),
			});

			// Send start point
			mapRef.current.sendToMap({ routeStartPoint: coords[0] });

			// Fit bounds to show the full route
			const lats = coords.map((c) => c[1]);
			const lngs = coords.map((c) => c[0]);
			const minLat = Math.min(...lats);
			const maxLat = Math.max(...lats);
			const minLng = Math.min(...lngs);
			const maxLng = Math.max(...lngs);
			const latPad = Math.max((maxLat - minLat) * 0.25, 0.001);
			const lngPad = Math.max((maxLng - minLng) * 0.25, 0.001);
			mapRef.current.sendToMap({
				fitBounds: [
					[minLng - lngPad, minLat - latPad],
					[maxLng + lngPad, maxLat + latPad],
				],
				fitBoundsPadding: 20,
				pitch: 40,
				bearing: 0,
			});

			// Apply projection onto centre-line, skipping interpolated points
			let processedCoords = coords;
			if (snap) {
				const interpolatedMask = activity.routePoints.map((p: RoutePoint) => !!p.interpolated);
				processedCoords = snapToRoad(coords, interpolatedMask);
			}

			mapRef.current.sendToMap({ routeCoordinates: processedCoords });
		},
		[],
	);

	// Re-send route whenever map is ready or settings change
	useEffect(() => {
		if (!mapMounted) return;
		sendRouteToMap(selectedActivity, snapEnabled);
	}, [mapMounted, selectedActivity, snapEnabled, sendRouteToMap]);

	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			setMapMounted(true);
		}
	}, []);

	// ── Render ─────────────────────────────────────────────────────────────────

	if (loading) {
		return (
			<View style={[styles.centered, { backgroundColor: theme.screen.background }]}>
				<ActivityIndicator size="large" color={ACCENT_COLOR} />
			</View>
		);
	}

	if (activities.length === 0) {
		return (
			<View style={[styles.centered, { backgroundColor: theme.screen.background }]}>
				<MaterialIcons name="directions-run" size={64} color={theme.screen.icon} />
				<Text style={[styles.emptyTitle, { color: theme.screen.text }]}>Keine Aktivitäten</Text>
				<Text style={[styles.emptySubtitle, { color: theme.screen.icon }]}>
					Zeichne zuerst eine Aktivität auf, um sie hier zu analysieren.
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* ── Map ─────────────────────────────────────────────────────────── */}
			<View style={styles.mapWrapper}>
				<MyMap
					key={mapKey}
					ref={mapRef}
					onMessage={handleMapMessage}
					injectScript={HEX_TILE_SCRIPT}
					centerAtUserLocationIfNoInitialPosition={false}
					initialCenter={routeInitialCenter}
					initialPitch={40}
				/>

				{/* Activity label overlay */}
				{selectedActivity && (
					<View style={styles.activityLabel}>
						<MaterialIcons name="directions-run" size={14} color="#ffffff" style={styles.activityLabelIcon} />
						<Text style={styles.activityLabelText} numberOfLines={1}>
							{formatActivityLabel(selectedActivity)}
						</Text>
					</View>
				)}
			</View>

			{/* ── Bottom controls ──────────────────────────────────────────────── */}
			<ScrollView
				style={[styles.controls, { backgroundColor: theme.screen.background }]}
				contentContainerStyle={styles.controlsContent}
				showsVerticalScrollIndicator={false}
			>
				<SettingsListGroupTitle title="Aktivität" />

				{/* Activity picker button */}
				<TouchableOpacity
					style={[
						styles.activityPickerButton,
						{
							backgroundColor: theme.screen.background,
							borderColor: theme.screen.iconBg,
						},
					]}
					onPress={() => setActivityPickerOpen((v) => !v)}
					activeOpacity={0.75}
				>
					<MaterialIcons name="directions-run" size={20} color={ACCENT_COLOR} />
					<View style={styles.activityPickerText}>
						<Text style={[styles.activityPickerLabel, { color: theme.screen.text }]} numberOfLines={1}>
							{selectedActivity ? formatActivityLabel(selectedActivity) : 'Aktivität wählen…'}
						</Text>
					</View>
					<Ionicons
						name={activityPickerOpen ? 'chevron-up' : 'chevron-down'}
						size={18}
						color={theme.screen.icon}
					/>
				</TouchableOpacity>

				{/* Inline activity list */}
				{activityPickerOpen && (
					<View style={[styles.activityList, { borderColor: theme.screen.iconBg }]}>
						{activities.map((act, idx) => {
							const isSelected = selectedActivity?.id === act.id;
							return (
								<TouchableOpacity
									key={act.id}
									style={[
										styles.activityItem,
										idx < activities.length - 1 && {
											borderBottomWidth: StyleSheet.hairlineWidth,
											borderBottomColor: theme.screen.iconBg,
										},
										isSelected && { backgroundColor: ACCENT_COLOR + '22' },
									]}
									onPress={() => {
										setSelectedActivity(act);
										setActivityPickerOpen(false);
									}}
									activeOpacity={0.75}
								>
									<MaterialIcons
										name="directions-run"
										size={18}
										color={isSelected ? ACCENT_COLOR : theme.screen.icon}
									/>
									<Text
										style={[
											styles.activityItemText,
											{ color: isSelected ? ACCENT_COLOR : theme.screen.text },
										]}
										numberOfLines={1}
									>
										{formatActivityLabel(act)}
									</Text>
									{isSelected && (
										<Ionicons name="checkmark-circle" size={18} color={ACCENT_COLOR} />
									)}
								</TouchableOpacity>
							);
						})}
					</View>
				)}

				<SettingsListGroupTitle title="GPS-Verarbeitung" />

				<SettingsListBoolean
					leftIcon={<MaterialIcons name="my-location" size={20} color="#ffffff" />}
					iconBgColor={ACCENT_COLOR}
					label="Projektion auf Mittellinie"
					valueActive="Eingeschaltet"
					valueInactive="Ausgeschaltet"
					isEnabled={snapEnabled}
					onToggle={() => setSnapEnabled((v) => !v)}
					groupPosition="single"
				/>
			</ScrollView>
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centered: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 32,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: 14,
		textAlign: 'center',
	},
	// Map
	mapWrapper: {
		flex: 1,
		position: 'relative',
	},
	activityLabel: {
		position: 'absolute',
		top: 14,
		left: 14,
		right: 14,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.65)',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 7,
		gap: 6,
	},
	activityLabelIcon: {
		flexShrink: 0,
	},
	activityLabelText: {
		color: '#ffffff',
		fontSize: 13,
		fontWeight: '600',
		flex: 1,
	},
	// Controls
	controls: {
		maxHeight: 320,
	},
	controlsContent: {
		paddingVertical: 8,
		paddingBottom: 16,
	},
	// Activity picker
	activityPickerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 16,
		marginBottom: 4,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 12,
		borderWidth: 1,
		gap: 10,
	},
	activityPickerText: {
		flex: 1,
	},
	activityPickerLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	// Activity list
	activityList: {
		marginHorizontal: 16,
		marginBottom: 4,
		borderWidth: 1,
		borderRadius: 12,
		overflow: 'hidden',
	},
	activityItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 10,
	},
	activityItemText: {
		flex: 1,
		fontSize: 13,
		fontWeight: '500',
	},
});
