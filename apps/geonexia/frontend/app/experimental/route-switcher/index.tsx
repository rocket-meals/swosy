import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MyMap, MyMapHandle, useTheme } from 'repo-depkit-common-ui';
import { useSelector } from 'react-redux';
import { useFocusEffect } from 'expo-router';

import { SavedRoute, loadRoutes } from '../../../helpers/RouteStorage';
import { buildRouteDisplayData, computeHexBounds } from '../../../helpers/RouteDisplayHelper';
import {
	isAvailable as isH3Available,
	computeRouteLengthKm,
	formatDistanceKm,
} from '../../../helpers/H3Helper';
import { HEX_TILE_SCRIPT } from '../../../assets/hexTileScript';
import type { RootState } from '../../../store/store';

const AUTO_ROTATE_SPEED_DEG_PER_S = 5;
const FIT_BOUNDS_ANIMATION_DELAY_MS = 1200;
const CARD_WIDTH = 110;
const CARD_GAP = 8;

function formatDate(ts: number): string {
	return new Date(ts).toLocaleDateString(undefined, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

export default function RouteSwitcherScreen() {
	const { theme } = useTheme();
	const mapRef = useRef<MyMapHandle>(null);
	const flatListRef = useRef<FlatList<SavedRoute>>(null);
	const autoRotateTimerRef = useRef<number | null>(null);

	const [mapMounted, setMapMounted] = useState(false);
	const [mapKey, setMapKey] = useState(0);
	const [routes, setRoutes] = useState<SavedRoute[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const hexTileRecords = useSelector((state: RootState) => state.hexTiles.records);

	// Load routes on mount
	useEffect(() => {
		loadRoutes()
			.then((r) => {
				setRoutes(r);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	// Stop auto-rotate and remount map when screen loses focus
	useFocusEffect(
		useCallback(() => {
			return () => {
				if (autoRotateTimerRef.current) {
					clearTimeout(autoRotateTimerRef.current);
					autoRotateTimerRef.current = null;
				}
				if (mapRef.current) {
					mapRef.current.sendToMap({ autoRotate: false });
				}
				setMapMounted(false);
				setMapKey((k) => k + 1);
			};
		}, [])
	);

	// Handle messages from map WebView
	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			setMapMounted(true);
		}
	}, []);

	// Display a route on the map
	const displayRoute = useCallback(
		(route: SavedRoute) => {
			if (!mapRef.current || !isH3Available() || route.hexTiles.length === 0) return;

			if (autoRotateTimerRef.current) {
				clearTimeout(autoRotateTimerRef.current);
				autoRotateTimerRef.current = null;
			}
			mapRef.current.sendToMap({ autoRotate: false });

			try {
				const { hexTileGeoJson, hexWalkPathGeoJson } = buildRouteDisplayData(route, hexTileRecords);
				mapRef.current.sendToMap({ hexRouteOutlineMode: true });
				mapRef.current.sendToMap({ hexTileGeoJson });
				mapRef.current.sendToMap({ hexWalkPathGeoJson });
			} catch (err) {
				console.warn('[RouteSwitcher] Failed to build GeoJSON:', err);
			}

			const bounds = computeHexBounds(route.hexTiles);
			if (bounds) {
				const { minLat, maxLat, minLng, maxLng } = bounds;
				const latPad = Math.max((maxLat - minLat) * 0.3, 0.001);
				const lngPad = Math.max((maxLng - minLng) * 0.3, 0.001);
				mapRef.current.sendToMap({
					fitBounds: [
						[minLng - lngPad, minLat - latPad],
						[maxLng + lngPad, maxLat + latPad],
					],
					fitBoundsPadding: 30,
					pitch: 50,
					bearing: 0,
				});
			}

			autoRotateTimerRef.current = setTimeout(() => {
				if (mapRef.current) {
					mapRef.current.sendToMap({
						autoRotate: true,
						autoRotateSpeed: AUTO_ROTATE_SPEED_DEG_PER_S,
					});
				}
			}, FIT_BOUNDS_ANIMATION_DELAY_MS);
		},
		[hexTileRecords]
	);

	// Display first route once both map and routes are ready
	useEffect(() => {
		if (!mapMounted || routes.length === 0) return;
		const route = routes[selectedIndex];
		if (route) displayRoute(route);
	}, [mapMounted, routes, displayRoute]);

	// Select a route by index
	const selectRoute = useCallback(
		(index: number) => {
			if (index < 0 || index >= routes.length) return;
			setSelectedIndex(index);
			flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
			const route = routes[index];
			if (route && mapMounted) displayRoute(route);
		},
		[routes, mapMounted, displayRoute]
	);

	const handlePrev = useCallback(() => {
		selectRoute(selectedIndex > 0 ? selectedIndex - 1 : routes.length - 1);
	}, [selectedIndex, routes.length, selectRoute]);

	const handleNext = useCallback(() => {
		selectRoute(selectedIndex < routes.length - 1 ? selectedIndex + 1 : 0);
	}, [selectedIndex, routes.length, selectRoute]);

	if (loading) {
		return (
			<View style={[styles.centered, { backgroundColor: theme.screen.background }]}>
				<ActivityIndicator size="large" color="#2563eb" />
			</View>
		);
	}

	if (routes.length === 0) {
		return (
			<View style={[styles.centered, { backgroundColor: theme.screen.background }]}>
				<MaterialIcons name="map" size={64} color={theme.screen.icon} />
				<Text style={[styles.emptyTitle, { color: theme.screen.text }]}>Keine Routen vorhanden</Text>
				<Text style={[styles.emptySubtitle, { color: theme.screen.icon }]}>
					Erstelle zuerst eine Route, um sie hier zu sehen.
				</Text>
			</View>
		);
	}

	const selectedRoute = routes[selectedIndex];
	const distanceKm = selectedRoute ? computeRouteLengthKm(selectedRoute.hexTiles) : 0;

	return (
		<View style={styles.container}>
			{/* ── Full-screen map ─────────────────────────────────────── */}
			<View style={styles.mapWrapper}>
				<MyMap
					key={mapKey}
					ref={mapRef}
					onMessage={handleMapMessage}
					injectScript={HEX_TILE_SCRIPT}
					centerAtUserLocationIfNoInitialPosition={false}
					initialPitch={50}
				/>

				{/* Route name + stats overlay (top) */}
				{selectedRoute && (
					<View style={styles.infoOverlay}>
						<Text style={styles.infoRouteName} numberOfLines={2}>
							{selectedRoute.name}
						</Text>
						<Text style={styles.infoRouteSub}>
							{formatDistanceKm(distanceKm)}
							{'  ·  '}
							{selectedRoute.hexTiles.length} Kacheln
							{'  ·  '}
							{formatDate(selectedRoute.createdAt)}
						</Text>
					</View>
				)}

				{/* Route counter (top-right) */}
				<View style={styles.counterBadge}>
					<Text style={styles.counterText}>
						{selectedIndex + 1} / {routes.length}
					</Text>
				</View>

				{/* Prev / Next arrow buttons */}
				<TouchableOpacity style={[styles.navButton, styles.navLeft]} onPress={handlePrev} activeOpacity={0.75}>
					<MaterialIcons name="chevron-left" size={34} color="#ffffff" />
				</TouchableOpacity>
				<TouchableOpacity style={[styles.navButton, styles.navRight]} onPress={handleNext} activeOpacity={0.75}>
					<MaterialIcons name="chevron-right" size={34} color="#ffffff" />
				</TouchableOpacity>
			</View>

			{/* ── Horizontal route carousel ───────────────────────────── */}
			<View style={styles.carousel}>
				<FlatList
					ref={flatListRef}
					data={routes}
					keyExtractor={(item) => item.id}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.carouselContent}
					getItemLayout={(_, index) => ({
						length: CARD_WIDTH + CARD_GAP,
						offset: (CARD_WIDTH + CARD_GAP) * index,
						index,
					})}
					renderItem={({ item, index }) => {
						const isActive = index === selectedIndex;
						const km = computeRouteLengthKm(item.hexTiles);
						return (
							<TouchableOpacity
								style={[styles.card, isActive && styles.cardActive]}
								onPress={() => selectRoute(index)}
								activeOpacity={0.8}
							>
								<MaterialIcons
									name="map"
									size={22}
									color={isActive ? '#60a5fa' : '#6b7280'}
								/>
								<Text
									style={[styles.cardName, isActive && styles.cardNameActive]}
									numberOfLines={2}
								>
									{item.name}
								</Text>
								<Text style={[styles.cardDist, isActive && styles.cardDistActive]}>
									{formatDistanceKm(km)}
								</Text>
							</TouchableOpacity>
						);
					}}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0a0a0f',
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
	// ── Map area ──────────────────────────────────────────────────────────────
	mapWrapper: {
		flex: 1,
		position: 'relative',
	},
	infoOverlay: {
		position: 'absolute',
		top: 14,
		left: 14,
		right: 76,
		backgroundColor: 'rgba(0, 0, 0, 0.68)',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	infoRouteName: {
		color: '#ffffff',
		fontSize: 20,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	infoRouteSub: {
		color: '#9ca3af',
		fontSize: 12,
		marginTop: 3,
	},
	counterBadge: {
		position: 'absolute',
		top: 14,
		right: 14,
		backgroundColor: 'rgba(0, 0, 0, 0.68)',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	counterText: {
		color: '#ffffff',
		fontSize: 13,
		fontWeight: '600',
	},
	navButton: {
		position: 'absolute',
		top: '50%',
		marginTop: -28,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: 'rgba(0, 0, 0, 0.55)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.18)',
	},
	navLeft: {
		left: 12,
	},
	navRight: {
		right: 12,
	},
	// ── Carousel ─────────────────────────────────────────────────────────────
	carousel: {
		paddingVertical: 10,
		backgroundColor: 'rgba(10, 10, 15, 0.95)',
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(255,255,255,0.08)',
	},
	carouselContent: {
		paddingHorizontal: 12,
		gap: CARD_GAP,
	},
	card: {
		width: CARD_WIDTH,
		paddingHorizontal: 8,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: '#1c1c24',
		borderWidth: 1.5,
		borderColor: 'transparent',
		alignItems: 'center',
		gap: 5,
	},
	cardActive: {
		borderColor: '#2563eb',
		backgroundColor: '#1e3050',
	},
	cardName: {
		color: '#9ca3af',
		fontSize: 11,
		textAlign: 'center',
		fontWeight: '500',
	},
	cardNameActive: {
		color: '#e0eaff',
		fontWeight: '700',
	},
	cardDist: {
		color: '#4b5563',
		fontSize: 10,
	},
	cardDistActive: {
		color: '#60a5fa',
	},
});
