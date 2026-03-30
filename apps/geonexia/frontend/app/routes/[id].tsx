import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
	MyMap,
	MyMapHandle,
	SettingsList,
	SettingsListGroupTitle,
	SettingsListTextInput,
	useTheme,
} from 'repo-depkit-common-ui';
import { useSelector } from 'react-redux';

import { SavedRoute, loadRoute, saveRoute, deleteRoute } from '../../helpers/RouteStorage';
import { HEX_TILE_SCRIPT } from '../../assets/hexTileScript';
import { cellToBoundary, cellToLatLng, isAvailable as isH3Available, computeRouteLengthKm, formatDistanceKm } from '../../helpers/H3Helper';
import { HexTileRecord } from '../../helpers/HexTileStorage';
import type { RootState } from '../../store/store';

const AUTO_ROTATE_SPEED_DEG_PER_S = 5;
const PRIMARY_COLOR = '#2563eb';
const H3_GEOJSON_ORDER = true;

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString(undefined, {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

/**
 * Build a hexTileGeoJson FeatureCollection from an ordered list of H3 hex cell indices.
 * Each cell is rendered as a polygon colored by its level from the Redux store.
 */
function buildRouteHexGeoJson(
	hexTiles: string[],
	hexTileRecords: Record<string, HexTileRecord>,
): { type: 'FeatureCollection'; features: object[] } {
	const features: object[] = [];
	for (const cell of hexTiles) {
		try {
			const boundary = cellToBoundary(cell, H3_GEOJSON_ORDER);
			if (boundary.length === 0) continue;
			const level = hexTileRecords[cell]?.level ?? 0;
			features.push({
				type: 'Feature',
				geometry: { type: 'Polygon', coordinates: [boundary] },
				properties: { h3Index: cell, level },
			});
		} catch {
			// Skip invalid cells
		}
	}
	return { type: 'FeatureCollection', features };
}

/**
 * Compute the geographic bounding box of a list of H3 cells using their center points.
 */
function computeHexBounds(hexTiles: string[]): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
	if (hexTiles.length === 0) return null;
	let minLat = Infinity;
	let maxLat = -Infinity;
	let minLng = Infinity;
	let maxLng = -Infinity;
	for (const cell of hexTiles) {
		try {
			const [lat, lng] = cellToLatLng(cell);
			if (lat < minLat) minLat = lat;
			if (lat > maxLat) maxLat = lat;
			if (lng < minLng) minLng = lng;
			if (lng > maxLng) maxLng = lng;
		} catch {
			// Skip invalid cells
		}
	}
	if (!isFinite(minLat)) return null;
	return { minLat, maxLat, minLng, maxLng };
}

export default function RouteDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { theme } = useTheme();
	const router = useRouter();
	const navigation = useNavigation();
	const mapRef = useRef<MyMapHandle>(null);
	const [route, setRoute] = useState<SavedRoute | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [mapMounted, setMapMounted] = useState(false);
	const hexTileRecords = useSelector((state: RootState) => state.hexTiles.records);

	// Stop map-side auto-rotate on unmount
	useEffect(() => {
		return () => {
			if (mapRef.current) {
				mapRef.current.sendToMap({ autoRotate: false });
			}
		};
	}, []);

	// Show back arrow in header
	useLayoutEffect(() => {
		navigation.setOptions({
			headerStyle: { backgroundColor: theme.header.background },
			headerTintColor: theme.header.text,
			headerLeft: () => (
				<TouchableOpacity
					onPress={() => router.navigate('/routes')}
					style={styles.headerBackButton}
					activeOpacity={0.7}
				>
					<MaterialIcons name="arrow-back" size={24} color={theme.header.text} />
				</TouchableOpacity>
			),
		});
	}, [navigation, router, theme.header.background, theme.header.text]);

	// Load route by id
	useEffect(() => {
		if (!id) {
			setNotFound(true);
			return;
		}
		loadRoute(id)
			.then((r) => {
				if (!r) {
					setNotFound(true);
					return;
				}
				setRoute(r);
			})
			.catch(() => setNotFound(true));
	}, [id]);

	// Once both route and map are ready, send hex tiles and fit bounds
	useEffect(() => {
		if (!mapMounted || !route || !mapRef.current) return;
		if (!isH3Available() || route.hexTiles.length === 0) return;

		// Build and send hexagon tile GeoJSON (no speed segments, no walk path)
		try {
			const hexTileGeoJson = buildRouteHexGeoJson(route.hexTiles, hexTileRecords);
			mapRef.current.sendToMap({ hexTileGeoJson });
		} catch (err) {
			console.warn('[RouteDetailScreen] Failed to build route hex GeoJSON:', err);
		}

		// Fit the camera to the full route extent
		const bounds = computeHexBounds(route.hexTiles);
		if (bounds) {
			const { minLat, maxLat, minLng, maxLng } = bounds;
			const latPad = Math.max((maxLat - minLat) * 0.25, 0.001);
			const lngPad = Math.max((maxLng - minLng) * 0.25, 0.001);
			mapRef.current.sendToMap({
				fitBounds: [[minLng - lngPad, minLat - latPad], [maxLng + lngPad, maxLat + latPad]],
				fitBoundsPadding: 20,
				pitch: 45,
				bearing: 0,
			});
		}

		// Start smooth auto-rotate after the fitBounds animation finishes
		const FIT_BOUNDS_ANIMATION_DELAY_MS = 1200;
		const delayTimer = setTimeout(() => {
			if (mapRef.current) {
				mapRef.current.sendToMap({
					autoRotate: true,
					autoRotateSpeed: AUTO_ROTATE_SPEED_DEG_PER_S,
				});
			}
		}, FIT_BOUNDS_ANIMATION_DELAY_MS);

		return () => {
			clearTimeout(delayTimer);
			if (mapRef.current) {
				mapRef.current.sendToMap({ autoRotate: false });
			}
		};
	}, [mapMounted, route, hexTileRecords]);

	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			setMapMounted(true);
		}
	}, []);

	const handleDelete = useCallback(() => {
		if (!route) return;
		Alert.alert('Route löschen', 'Möchtest du diese Route wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.', [
			{ text: 'Abbrechen', style: 'cancel' },
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: () => {
					deleteRoute(route.id);
					router.replace('/routes');
				},
			},
		]);
	}, [route, router]);

	if (notFound) {
		return (
			<View style={[styles.centeredContainer, { backgroundColor: theme.screen.background }]}>
				<MaterialIcons name="error-outline" size={48} color={theme.screen.icon} />
				<Text style={[styles.notFoundText, { color: theme.screen.text }]}>Route nicht gefunden.</Text>
				<TouchableOpacity style={styles.backButton} onPress={() => router.navigate('/routes')}>
					<Text style={styles.backButtonText}>Zurück</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (!route) {
		return (
			<View style={[styles.centeredContainer, { backgroundColor: theme.screen.background }]}>
				<Text style={[styles.loadingText, { color: theme.screen.icon }]}>Laden…</Text>
			</View>
		);
	}

	const distanceKm = computeRouteLengthKm(route.hexTiles);
	const tileCount = route.hexTiles.length;

	// Compute initial map center from route bounds
	const routeInitialCenter = (() => {
		const bounds = computeHexBounds(route.hexTiles);
		if (!bounds) return undefined;
		return { lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 };
	})();

	const infoRows: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }[] = [
		{ icon: 'event', label: 'Erstellt am', value: formatDate(route.createdAt) },
		{ icon: 'straighten', label: 'Streckenlänge', value: formatDistanceKm(distanceKm) },
		{ icon: 'grid-on', label: 'Kacheln', value: String(tileCount) },
		{ icon: 'layers', label: 'H3-Auflösung', value: String(route.h3Resolution) },
		...(route.sportType
			? [{ icon: 'directions-run' as React.ComponentProps<typeof MaterialIcons>['name'], label: 'Sportart', value: route.sportType }]
			: []),
	];

	const lastInfoIdx = infoRows.length - 1;

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			{/* Map – 1:1 square at the top */}
			<View style={styles.mapContainer}>
				<MyMap
					ref={mapRef}
					onMessage={handleMapMessage}
					injectScript={HEX_TILE_SCRIPT}
					centerAtUserLocationIfNoInitialPosition={false}
					initialCenter={routeInitialCenter}
					initialPitch={45}
				/>
			</View>

			{/* Info list */}
			<View style={styles.statsContent}>
				<SettingsListGroupTitle title="Routen-Informationen" />
				{infoRows.map((row, idx) => (
					<SettingsList
						key={row.label}
						leftIcon={<MaterialIcons name={row.icon} size={20} color="#ffffff" />}
						iconBackgroundColor={PRIMARY_COLOR}
						title={row.label}
						value={row.value}
						showSeparator={idx < lastInfoIdx}
						groupPosition={infoRows.length === 1 ? 'single' : idx === 0 ? 'top' : idx === lastInfoIdx ? 'bottom' : 'middle'}
					/>
				))}

				<SettingsListGroupTitle title="Name anpassen" />
				<SettingsListTextInput
					title="Route umbenennen"
					placeholder="Route Name"
					modalTitle="Route umbenennen"
					initialValue={route.name}
					groupPosition="single"
					onSave={(newName) => {
						const trimmed = newName.trim();
						if (!trimmed) return;
						const updated: SavedRoute = { ...route, name: trimmed };
						try {
							saveRoute(updated);
						} catch {
							Alert.alert('Fehler', 'Der Name der Route konnte nicht gespeichert werden.');
							return;
						}
						setRoute(updated);
					}}
				/>

				<TouchableOpacity
					style={styles.deleteButton}
					onPress={handleDelete}
					activeOpacity={0.8}
				>
					<MaterialIcons name="delete-outline" size={18} color="#ef4444" />
					<Text style={styles.deleteButtonText}>Route löschen</Text>
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
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
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
});
