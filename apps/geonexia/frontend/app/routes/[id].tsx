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
import { isAvailable as isH3Available, computeRouteLengthKm, formatDistanceKm, gridDisk, cellToLatLng, cellToBoundary } from '../../helpers/H3Helper';
import { buildRouteDisplayData, computeHexBounds, computeEdgesFromHexTiles } from '../../helpers/RouteDisplayHelper';
import type { RootState } from '../../store/store';

const AUTO_ROTATE_SPEED_DEG_PER_S = 5;
const PRIMARY_COLOR = '#2563eb';

type MapEditSubMode = 'add' | 'remove';

function formatDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString(undefined, {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
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
	const [isEditing, setIsEditing] = useState(false);
	const [editedHexTiles, setEditedHexTiles] = useState<string[]>([]);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [mapEditSubMode, setMapEditSubMode] = useState<MapEditSubMode>('add');
	const [addAnchorTileIndex, setAddAnchorTileIndex] = useState<number | null>(null);
	const hexTileRecords = useSelector((state: RootState) => state.hexTiles.records);

	// Stable ref so handleMapMessage can always read the latest edit state without
	// being recreated on every state change.
	const editStateRef = useRef({
		isEditing: false,
		mapEditSubMode: 'add' as MapEditSubMode,
		addAnchorTileIndex: null as number | null,
		editedHexTiles: [] as string[],
	});
	editStateRef.current = { isEditing, mapEditSubMode, addAnchorTileIndex, editedHexTiles };

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

		// Build and send hexagon tile GeoJSON and walk path lines
		try {
			const { hexTileGeoJson, hexWalkPathGeoJson } = buildRouteDisplayData(route, hexTileRecords);
			mapRef.current.sendToMap({ hexTileGeoJson });
			mapRef.current.sendToMap({ hexWalkPathGeoJson });
		} catch (err) {
			console.warn('[RouteDetailScreen] Failed to build route display GeoJSON:', err);
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

	// Live map update during editing
	useEffect(() => {
		if (!isEditing || !mapMounted || !mapRef.current || !route) return;
		if (!isH3Available()) return;

		if (editedHexTiles.length === 0) {
			mapRef.current.sendToMap({ hexTileGeoJson: { type: 'FeatureCollection', features: [] } });
			mapRef.current.sendToMap({ hexWalkPathGeoJson: { type: 'FeatureCollection', features: [] } });
			return;
		}

		const tempRoute: SavedRoute = {
			...route,
			hexTiles: editedHexTiles,
			walkedEdges: computeEdgesFromHexTiles(editedHexTiles),
		};

		try {
			const { hexTileGeoJson, hexWalkPathGeoJson } = buildRouteDisplayData(tempRoute, hexTileRecords);
			mapRef.current.sendToMap({ hexTileGeoJson });
			mapRef.current.sendToMap({ hexWalkPathGeoJson });
		} catch {
			// Skip if build fails
		}
	}, [isEditing, editedHexTiles, mapMounted, hexTileRecords, route]);

	// ─── Route editing ─────────────────────────────────────────────────────

	const handleRemoveTile = useCallback((index: number) => {
		setEditedHexTiles((prev) => {
			const updated = [...prev];
			updated.splice(index, 1);
			return updated;
		});
		setAddAnchorTileIndex(null);
		setHasUnsavedChanges(true);
	}, []);

	const handleInsertTile = useCallback((index: number, h3Index: string) => {
		setEditedHexTiles((prev) => {
			const updated = [...prev];
			updated.splice(index, 0, h3Index);
			return updated;
		});
		setHasUnsavedChanges(true);
	}, []);

	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string; h3Index?: string };
		if (msg.tag === 'MapComponentMounted') {
			setMapMounted(true);
			return;
		}
		const state = editStateRef.current;
		if (!state.isEditing || !msg.h3Index) return;

		if (msg.tag === 'HexTileClicked') {
			const tileIdx = state.editedHexTiles.indexOf(msg.h3Index);
			if (tileIdx === -1) return;
			if (state.mapEditSubMode === 'remove') {
				handleRemoveTile(tileIdx);
			} else if (state.mapEditSubMode === 'add') {
				// Select (or re-select) anchor tile; tapping a different tile while
				// anchor is active simply switches the anchor.
				setAddAnchorTileIndex(tileIdx);
			}
		}

		if (msg.tag === 'HexNeighborClicked' && state.addAnchorTileIndex !== null) {
			handleInsertTile(state.addAnchorTileIndex + 1, msg.h3Index);
			setAddAnchorTileIndex(null);
		}
	}, [handleRemoveTile, handleInsertTile]);

	const handleStartEditing = useCallback(() => {
		if (!route) return;
		setEditedHexTiles([...route.hexTiles]);
		setHasUnsavedChanges(false);
		setMapEditSubMode('add');
		setAddAnchorTileIndex(null);
		setIsEditing(true);
		// Stop auto-rotate while editing so the map stays stable
		if (mapRef.current) {
			mapRef.current.sendToMap({ autoRotate: false });
		}
	}, [route]);

	const handleCancelEditing = useCallback(() => {
		const doCancel = () => {
			setIsEditing(false);
			setHasUnsavedChanges(false);
			setAddAnchorTileIndex(null);
			if (mapRef.current) {
				mapRef.current.sendToMap({ routeEditLabels: null });
				mapRef.current.sendToMap({ routeEditNeighbors: null });
			}
		};
		if (hasUnsavedChanges) {
			Alert.alert('Änderungen verwerfen?', 'Ungespeicherte Änderungen gehen verloren.', [
				{ text: 'Weiter bearbeiten', style: 'cancel' },
				{
					text: 'Verwerfen',
					style: 'destructive',
					onPress: doCancel,
				},
			]);
		} else {
			doCancel();
		}
	}, [hasUnsavedChanges]);

	const handleSaveEdits = useCallback(() => {
		if (!route || editedHexTiles.length === 0) return;
		const updatedRoute: SavedRoute = {
			...route,
			hexTiles: editedHexTiles,
			walkedEdges: computeEdgesFromHexTiles(editedHexTiles),
		};
		try {
			saveRoute(updatedRoute);
			setRoute(updatedRoute);
			setIsEditing(false);
			setHasUnsavedChanges(false);
			setAddAnchorTileIndex(null);
			if (mapRef.current) {
				mapRef.current.sendToMap({ routeEditLabels: null });
				mapRef.current.sendToMap({ routeEditNeighbors: null });
			}
		} catch {
			Alert.alert('Fehler', 'Die Änderungen konnten nicht gespeichert werden.');
		}
	}, [route, editedHexTiles]);

	// Send route-edit overlay (labels + neighbor highlight) to the map
	useEffect(() => {
		if (!isEditing || !mapMounted || !mapRef.current || !isH3Available()) return;

		// Build label GeoJSON: one Point feature per route tile
		const labelFeatures = editedHexTiles.map((cell, idx) => {
			let label: string;
			if (mapEditSubMode === 'remove') {
				label = '−';
			} else if (addAnchorTileIndex === null) {
				label = '+';
			} else {
				label = idx === addAnchorTileIndex ? '★' : '';
			}
			try {
				const [lat, lng] = cellToLatLng(cell);
				return {
					type: 'Feature' as const,
					geometry: { type: 'Point' as const, coordinates: [lng, lat] },
					properties: { h3Index: cell, label },
				};
			} catch (err) {
				console.warn('[RouteDetailScreen] Failed to get center for label cell', cell, err);
				return null;
			}
		}).filter(Boolean);

		mapRef.current.sendToMap({
			routeEditLabels: { type: 'FeatureCollection', features: labelFeatures },
		});

		// Build neighbor GeoJSON when an anchor tile is selected
		if (addAnchorTileIndex !== null && addAnchorTileIndex < editedHexTiles.length) {
			const anchorTile = editedHexTiles[addAnchorTileIndex];
			const tileSet = new Set(editedHexTiles);
			const neighbors = gridDisk(anchorTile, 1).filter((n) => n !== anchorTile && !tileSet.has(n));
			const neighborFeatures = neighbors.map((cell) => {
				try {
					const boundary = cellToBoundary(cell, true);
					return {
						type: 'Feature' as const,
						geometry: { type: 'Polygon' as const, coordinates: [boundary] },
						properties: { h3Index: cell },
					};
				} catch (err) {
					console.warn('[RouteDetailScreen] Failed to get boundary for neighbor cell', cell, err);
					return null;
				}
			}).filter(Boolean);
			mapRef.current.sendToMap({
				routeEditNeighbors: { type: 'FeatureCollection', features: neighborFeatures },
			});
		} else {
			mapRef.current.sendToMap({ routeEditNeighbors: null });
		}
	}, [isEditing, editedHexTiles, mapEditSubMode, addAnchorTileIndex, mapMounted]);

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

	const activeTiles = isEditing ? editedHexTiles : route.hexTiles;
	const distanceKm = computeRouteLengthKm(activeTiles);
	const tileCount = activeTiles.length;

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

	const addModeHasAnchor = isEditing && mapEditSubMode === 'add' && addAnchorTileIndex !== null;

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			{/* Map – 1:1 square at the top with edit overlay controls */}
			<View style={styles.mapContainer}>
				<MyMap
					ref={mapRef}
					onMessage={handleMapMessage}
					injectScript={HEX_TILE_SCRIPT}
					centerAtUserLocationIfNoInitialPosition={false}
					initialCenter={routeInitialCenter}
					initialPitch={45}
				/>

				{/* Edit-mode toggle – top-right corner, always visible */}
				<TouchableOpacity
					style={[styles.mapOverlayButton, styles.mapEditToggle, isEditing && styles.mapOverlayButtonActive]}
					onPress={isEditing ? handleCancelEditing : handleStartEditing}
					activeOpacity={0.8}
				>
					<MaterialIcons name="edit" size={20} color={isEditing ? '#ffffff' : PRIMARY_COLOR} />
				</TouchableOpacity>

				{/* Sub-mode buttons (+/-) and anchor hint – only in edit mode */}
				{isEditing && (
					<>
						{/* Sub-mode switcher – top-left */}
						<View style={styles.mapSubModeRow}>
							<TouchableOpacity
								style={[styles.mapSubModeButton, mapEditSubMode === 'add' && styles.mapSubModeButtonActive]}
								onPress={() => { setMapEditSubMode('add'); setAddAnchorTileIndex(null); }}
								activeOpacity={0.8}
							>
								<MaterialIcons name="add" size={22} color={mapEditSubMode === 'add' ? '#ffffff' : PRIMARY_COLOR} />
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.mapSubModeButton, mapEditSubMode === 'remove' && styles.mapSubModeButtonRemove]}
								onPress={() => { setMapEditSubMode('remove'); setAddAnchorTileIndex(null); }}
								activeOpacity={0.8}
							>
								<MaterialIcons name="remove" size={22} color={mapEditSubMode === 'remove' ? '#ffffff' : '#ef4444'} />
							</TouchableOpacity>
						</View>

						{/* Anchor-selection hint banner */}
						{mapEditSubMode === 'add' && (
							<View style={styles.mapHintBanner}>
								<Text style={styles.mapHintText} numberOfLines={1}>
									{addModeHasAnchor
										? 'Nachbar-Kachel antippen zum Einfügen'
										: 'Kachel antippen als Einfügepunkt wählen'}
								</Text>
								{addModeHasAnchor && (
									<TouchableOpacity onPress={() => setAddAnchorTileIndex(null)} activeOpacity={0.8} style={styles.mapHintClose}>
										<MaterialIcons name="close" size={14} color="#ffffff" />
									</TouchableOpacity>
								)}
							</View>
						)}

						{/* Save / Cancel – bottom of map */}
						<View style={styles.mapEditActions}>
							<TouchableOpacity
								style={styles.mapCancelButton}
								onPress={handleCancelEditing}
								activeOpacity={0.8}
							>
								<MaterialIcons name="close" size={16} color="#ffffff" />
								<Text style={styles.mapActionButtonText}>Abbrechen</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.mapSaveButton, editedHexTiles.length === 0 && styles.mapSaveButtonDisabled]}
								onPress={handleSaveEdits}
								disabled={editedHexTiles.length === 0}
								activeOpacity={0.8}
							>
								<MaterialIcons name="save" size={16} color="#ffffff" />
								<Text style={styles.mapActionButtonText}>Speichern</Text>
							</TouchableOpacity>
						</View>
					</>
				)}
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
	// ─── Map overlay controls ─────────────────────────────────────────────
	mapOverlayButton: {
		position: 'absolute',
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.92)',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.25,
		shadowRadius: 3,
		elevation: 4,
	},
	mapOverlayButtonActive: {
		backgroundColor: PRIMARY_COLOR,
	},
	mapEditToggle: {
		top: 10,
		right: 10,
	},
	mapSubModeRow: {
		position: 'absolute',
		top: 10,
		left: 10,
		flexDirection: 'column',
		gap: 6,
	},
	mapSubModeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.92)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: PRIMARY_COLOR,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 3,
	},
	mapSubModeButtonActive: {
		backgroundColor: PRIMARY_COLOR,
		borderColor: PRIMARY_COLOR,
	},
	mapSubModeButtonRemove: {
		backgroundColor: '#ef4444',
		borderColor: '#ef4444',
	},
	mapHintBanner: {
		position: 'absolute',
		bottom: 52,
		left: 10,
		right: 10,
		backgroundColor: 'rgba(0,0,0,0.65)',
		borderRadius: 8,
		paddingVertical: 6,
		paddingHorizontal: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	mapHintText: {
		flex: 1,
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '500',
	},
	mapHintClose: {
		padding: 2,
	},
	mapEditActions: {
		position: 'absolute',
		bottom: 10,
		left: 10,
		right: 10,
		flexDirection: 'row',
		gap: 8,
	},
	mapCancelButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 5,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: 'rgba(100,100,100,0.85)',
	},
	mapSaveButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 5,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: PRIMARY_COLOR,
	},
	mapSaveButtonDisabled: {
		opacity: 0.5,
	},
	mapActionButtonText: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '600',
	},
});
