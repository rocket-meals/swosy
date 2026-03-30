import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
import { isAvailable as isH3Available, computeRouteLengthKm, formatDistanceKm, gridDisk } from '../../helpers/H3Helper';
import { buildRouteDisplayData, computeHexBounds, computeEdgesFromHexTiles } from '../../helpers/RouteDisplayHelper';
import type { RootState } from '../../store/store';

const AUTO_ROTATE_SPEED_DEG_PER_S = 5;
const PRIMARY_COLOR = '#2563eb';

function formatH3Short(h3Index: string): string {
	if (h3Index.length <= 10) return h3Index;
	return h3Index.slice(0, 5) + '…' + h3Index.slice(-4);
}

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
	const [expandedInsertIndex, setExpandedInsertIndex] = useState<number | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

	const handleMapMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			setMapMounted(true);
		}
	}, []);

	// ─── Route editing ─────────────────────────────────────────────────────

	const handleStartEditing = useCallback(() => {
		if (!route) return;
		setEditedHexTiles([...route.hexTiles]);
		setExpandedInsertIndex(null);
		setHasUnsavedChanges(false);
		setIsEditing(true);
	}, [route]);

	const handleCancelEditing = useCallback(() => {
		if (hasUnsavedChanges) {
			Alert.alert('Änderungen verwerfen?', 'Ungespeicherte Änderungen gehen verloren.', [
				{ text: 'Weiter bearbeiten', style: 'cancel' },
				{
					text: 'Verwerfen',
					style: 'destructive',
					onPress: () => {
						setIsEditing(false);
						setExpandedInsertIndex(null);
						setHasUnsavedChanges(false);
					},
				},
			]);
		} else {
			setIsEditing(false);
			setExpandedInsertIndex(null);
		}
	}, [hasUnsavedChanges]);

	const handleRemoveTile = useCallback((index: number) => {
		setEditedHexTiles((prev) => {
			const updated = [...prev];
			updated.splice(index, 1);
			return updated;
		});
		setExpandedInsertIndex(null);
		setHasUnsavedChanges(true);
	}, []);

	const handleInsertTile = useCallback((index: number, h3Index: string) => {
		setEditedHexTiles((prev) => {
			const updated = [...prev];
			updated.splice(index, 0, h3Index);
			return updated;
		});
		setExpandedInsertIndex(null);
		setHasUnsavedChanges(true);
	}, []);

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
			setExpandedInsertIndex(null);
		} catch {
			Alert.alert('Fehler', 'Die Änderungen konnten nicht gespeichert werden.');
		}
	}, [route, editedHexTiles]);

	const getInsertCandidates = useCallback(
		(index: number): string[] => {
			if (!isH3Available()) return [];
			const tiles = editedHexTiles;
			const candidates = new Set<string>();

			// Get neighbors from the tile before the insertion point
			if (index > 0) {
				try {
					const disk = gridDisk(tiles[index - 1], 1);
					if (disk) disk.forEach((c) => candidates.add(c));
				} catch {
					// Skip if H3 fails
				}
			}

			// Get neighbors from the tile after the insertion point
			if (index < tiles.length) {
				try {
					const disk = gridDisk(tiles[index], 1);
					if (disk) disk.forEach((c) => candidates.add(c));
				} catch {
					// Skip if H3 fails
				}
			}

			// Fallback: use nearest tile if nothing found yet
			if (candidates.size === 0 && tiles.length > 0) {
				const refIdx = Math.min(index, tiles.length - 1);
				try {
					const disk = gridDisk(tiles[refIdx], 1);
					if (disk) disk.forEach((c) => candidates.add(c));
				} catch {
					// Skip if H3 fails
				}
			}

			return Array.from(candidates).sort();
		},
		[editedHexTiles],
	);

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

	const renderInsertButton = (index: number) => {
		const isExpanded = expandedInsertIndex === index;
		return (
			<View style={styles.insertSection}>
				<TouchableOpacity
					style={styles.insertButton}
					onPress={() => setExpandedInsertIndex(isExpanded ? null : index)}
					activeOpacity={0.7}
				>
					<View style={[styles.insertLine, { backgroundColor: theme.screen.icon + '30' }]} />
					<View style={[styles.insertIconCircle, isExpanded && styles.insertIconCircleExpanded]}>
						<MaterialIcons name={isExpanded ? 'close' : 'add'} size={14} color={isExpanded ? '#ffffff' : PRIMARY_COLOR} />
					</View>
					<View style={[styles.insertLine, { backgroundColor: theme.screen.icon + '30' }]} />
				</TouchableOpacity>
				{isExpanded && (
					<View style={styles.candidateContainer}>
						<Text style={[styles.candidateTitle, { color: theme.screen.icon }]}>Nachbar-Kachel auswählen:</Text>
						<View style={styles.candidateGrid}>
							{getInsertCandidates(index).map((candidate) => (
								<TouchableOpacity
									key={candidate}
									style={[styles.candidateChip, { backgroundColor: theme.screen.iconBg }]}
									onPress={() => handleInsertTile(index, candidate)}
									activeOpacity={0.7}
								>
									<Text style={[styles.candidateChipText, { color: theme.screen.text }]}>
										{formatH3Short(candidate)}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				)}
			</View>
		);
	};

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

				{/* ─── Route tile editing section ─────────────────────── */}
				<SettingsListGroupTitle title="Kacheln bearbeiten" />
				{isEditing ? (
					<>
						<View style={styles.editTileList}>
							{renderInsertButton(0)}
							{editedHexTiles.map((tile, idx) => (
								<React.Fragment key={`edit-tile-${idx}`}>
									<View style={[styles.tileRow, { backgroundColor: theme.screen.iconBg }]}>
										<View style={styles.tileIndexBadge}>
											<Text style={styles.tileIndexText}>{idx + 1}</Text>
										</View>
										<Text
											style={[styles.tileIdText, { color: theme.screen.text }]}
											numberOfLines={1}
											ellipsizeMode="middle"
										>
											{formatH3Short(tile)}
										</Text>
										<TouchableOpacity
											onPress={() => handleRemoveTile(idx)}
											style={styles.removeTileButton}
											activeOpacity={0.7}
										>
											<MaterialIcons name="remove-circle" size={22} color="#ef4444" />
										</TouchableOpacity>
									</View>
									{renderInsertButton(idx + 1)}
								</React.Fragment>
							))}
							{editedHexTiles.length === 0 && (
								<Text style={[styles.emptyEditText, { color: theme.screen.icon }]}>
									Keine Kacheln vorhanden.
								</Text>
							)}
						</View>

						<View style={styles.editActions}>
							<TouchableOpacity
								style={[styles.saveEditButton, editedHexTiles.length === 0 && styles.saveEditButtonDisabled]}
								onPress={handleSaveEdits}
								activeOpacity={0.8}
								disabled={editedHexTiles.length === 0}
							>
								<MaterialIcons name="save" size={18} color="#ffffff" />
								<Text style={styles.saveEditButtonText}>Speichern</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.cancelEditButton}
								onPress={handleCancelEditing}
								activeOpacity={0.8}
							>
								<Text style={styles.cancelEditButtonText}>Abbrechen</Text>
							</TouchableOpacity>
						</View>
					</>
				) : (
					<TouchableOpacity
						style={[styles.editRouteButton, { borderColor: PRIMARY_COLOR }]}
						onPress={handleStartEditing}
						activeOpacity={0.8}
					>
						<MaterialIcons name="edit" size={18} color={PRIMARY_COLOR} />
						<Text style={[styles.editRouteButtonText, { color: PRIMARY_COLOR }]}>Kacheln bearbeiten</Text>
					</TouchableOpacity>
				)}

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
	// ─── Route editing styles ────────────────────────────────────────────
	editTileList: {
		gap: 0,
	},
	tileRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 10,
		gap: 10,
	},
	tileIndexBadge: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: PRIMARY_COLOR,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tileIndexText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '700',
	},
	tileIdText: {
		flex: 1,
		fontSize: 13,
		fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
	},
	removeTileButton: {
		padding: 4,
	},
	emptyEditText: {
		fontSize: 14,
		textAlign: 'center',
		paddingVertical: 16,
	},
	insertSection: {
		paddingVertical: 2,
	},
	insertButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 4,
	},
	insertLine: {
		flex: 1,
		height: 1,
	},
	insertIconCircle: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1.5,
		borderColor: PRIMARY_COLOR,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 8,
	},
	insertIconCircleExpanded: {
		backgroundColor: PRIMARY_COLOR,
		borderColor: PRIMARY_COLOR,
	},
	candidateContainer: {
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	candidateTitle: {
		fontSize: 12,
		marginBottom: 6,
	},
	candidateGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
	},
	candidateChip: {
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 8,
	},
	candidateChipText: {
		fontSize: 12,
		fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
	},
	editActions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 12,
	},
	saveEditButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: PRIMARY_COLOR,
		paddingVertical: 12,
		borderRadius: 10,
		gap: 6,
	},
	saveEditButtonDisabled: {
		opacity: 0.5,
	},
	saveEditButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	cancelEditButton: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#888888',
	},
	cancelEditButtonText: {
		color: '#888888',
		fontSize: 15,
		fontWeight: '600',
	},
	editRouteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 10,
		borderWidth: 1,
		gap: 8,
	},
	editRouteButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
});
