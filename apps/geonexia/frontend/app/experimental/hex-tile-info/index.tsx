import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, SettingsListNumberInput, useTheme } from 'repo-depkit-common-ui';
import * as Clipboard from 'expo-clipboard';

import { isAvailable as isH3Available, cellToLatLng, cellToBoundary, getResolution, isValidCell } from '../../../helpers/H3Helper';
import { queryTileFeaturesForHexCell } from '../../../helpers/TileFeatureHelper';
import type { MapFeatureInfo } from '../../../helpers/RouteNameSuggestionHelper';

const HEX_ID = '8a1f10d5061ffff';
const DEFAULT_ZOOM = 14;
const EXPERIMENTAL_COLOR = '#7c3aed';

export default function HexTileInfoScreen() {
	const { theme } = useTheme();
	const [zoom, setZoom] = useState(DEFAULT_ZOOM);
	const [features, setFeatures] = useState<MapFeatureInfo[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const runIdRef = useRef(0);

	const fetchFeatures = useCallback(async (queryZoom: number) => {
		const runId = ++runIdRef.current;

		setLoading(true);
		setError(null);
		setFeatures(null);

		try {
			if (!isH3Available()) {
				throw new Error('H3 Bibliothek nicht verfügbar');
			}
			if (!isValidCell(HEX_ID)) {
				throw new Error(`Ungültige H3 Zelle: ${HEX_ID}`);
			}

			const result = await queryTileFeaturesForHexCell(HEX_ID, queryZoom);
			if (runId !== runIdRef.current) return;
			setFeatures(result);
		} catch (err) {
			if (runId !== runIdRef.current) return;
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			if (runId === runIdRef.current) {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		fetchFeatures(zoom);
	}, [zoom, fetchFeatures]);

	const resolution = isH3Available() && isValidCell(HEX_ID) ? getResolution(HEX_ID) : null;
	const center = isH3Available() && isValidCell(HEX_ID) ? cellToLatLng(HEX_ID) : null;

	// Compute boundary min/max
	const boundary = isH3Available() && isValidCell(HEX_ID) ? cellToBoundary(HEX_ID) : [];
	const lats = boundary.map((v: [number, number]) => v[0]);
	const lngs = boundary.map((v: [number, number]) => v[1]);
	const minLat = lats.length > 0 ? Math.min(...lats) : null;
	const maxLat = lats.length > 0 ? Math.max(...lats) : null;
	const minLng = lngs.length > 0 ? Math.min(...lngs) : null;
	const maxLng = lngs.length > 0 ? Math.max(...lngs) : null;

	// Categorize features (same logic as MagnifyModalContent)
	const streets = features?.filter((f) =>
		f.highway || (f.layerId && (f.layerId.includes('road') || f.layerId.includes('highway')))
	) ?? [];
	const waterways = features?.filter((f) =>
		f.waterway || (f.layerId && f.layerId.includes('water'))
	) ?? [];
	const buildings = features?.filter((f) =>
		f.building || (f.layerId && f.layerId.includes('building'))
	) ?? [];
	const pois = features?.filter((f) =>
		f.amenity || f.natural || f.landuse ||
		(f.layerId && (f.layerId.includes('poi') || f.layerId.includes('park') || f.layerId.includes('landuse') || f.layerId.includes('landcover')))
	) ?? [];

	const handleCopyJson = useCallback(async () => {
		if (!features) return;
		const json = JSON.stringify(features, null, 2);
		await Clipboard.setStringAsync(json);
		Alert.alert('Kopiert', 'JSON in Zwischenablage kopiert.');
	}, [features]);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<SettingsListGroupTitle title="Hex Tile" />
				<SettingsList
					iconBgColor="#6b7280"
					leftIcon={<MaterialIcons name="tag" size={22} color="#ffffff" />}
					label="H3 Index"
					value={HEX_ID}
					groupPosition="first"
				/>
				{resolution !== null && (
					<SettingsList
						iconBgColor={EXPERIMENTAL_COLOR}
						leftIcon={<Ionicons name="grid-outline" size={22} color="#ffffff" />}
						label="Resolution"
						value={String(resolution)}
						groupPosition="middle"
					/>
				)}
				{center !== null && (
					<SettingsList
						iconBgColor={EXPERIMENTAL_COLOR}
						leftIcon={<Ionicons name="location-outline" size={22} color="#ffffff" />}
						label="Zentrum"
						value={`${center[0].toFixed(6)}°N, ${center[1].toFixed(6)}°E`}
						groupPosition="middle"
					/>
				)}
				{minLat !== null && maxLat !== null && minLng !== null && maxLng !== null && (
					<SettingsList
						iconBgColor={EXPERIMENTAL_COLOR}
						leftIcon={<Ionicons name="resize-outline" size={22} color="#ffffff" />}
						label="Boundary (min/max)"
						value={`Lat: ${minLat.toFixed(6)} – ${maxLat.toFixed(6)}\nLng: ${minLng.toFixed(6)} – ${maxLng.toFixed(6)}`}
						groupPosition="middle"
					/>
				)}
				<SettingsListNumberInput
					iconBgColor={EXPERIMENTAL_COLOR}
					leftIcon={<Ionicons name="search-outline" size={22} color="#ffffff" />}
					label="Zoom"
					value={String(zoom)}
					initialValue={zoom}
					min={1}
					max={20}
					step={1}
					saveLabel="Übernehmen"
					modalTitle="Zoom-Level"
					onSave={setZoom}
					groupPosition="last"
				/>

				<TouchableOpacity
					style={[styles.reloadButton, { backgroundColor: EXPERIMENTAL_COLOR }]}
					onPress={() => fetchFeatures(zoom)}
					activeOpacity={0.8}
					disabled={loading}
				>
					<Ionicons name="reload-outline" size={18} color="#ffffff" />
					<Text style={styles.reloadButtonText}>Neu laden</Text>
				</TouchableOpacity>

				{loading && (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={EXPERIMENTAL_COLOR} />
						<Text style={[styles.loadingText, { color: theme.screen.textColor }]}>
							Lade Tile-Features…
						</Text>
					</View>
				)}

				{error && (
					<View style={styles.errorContainer}>
						<Ionicons name="alert-circle" size={24} color="#ef4444" />
						<Text style={styles.errorText}>{error}</Text>
					</View>
				)}

				{features && features.length === 0 && !loading && (
					<SettingsList
						iconBgColor="#6b7280"
						leftIcon={<MaterialIcons name="info-outline" size={22} color="#ffffff" />}
						label="Keine Karteninformationen"
						value="Keine Features in diesem Bereich gefunden."
						groupPosition="single"
					/>
				)}

				{streets.length > 0 && (
					<>
						<SettingsListGroupTitle title="Straßen" />
						{streets.map((f, idx) => (
							<SettingsList
								key={`street-${idx}`}
								iconBgColor="#f97316"
								leftIcon={<MaterialIcons name="directions" size={22} color="#ffffff" />}
								label={f.name ?? f.highway ?? f.class ?? `Straße ${idx + 1}`}
								value={JSON.stringify(f)}
								groupPosition={streets.length === 1 ? 'single' : idx === 0 ? 'first' : idx === streets.length - 1 ? 'last' : 'middle'}
							/>
						))}
					</>
				)}

				{waterways.length > 0 && (
					<>
						<SettingsListGroupTitle title="Gewässer" />
						{waterways.map((f, idx) => (
							<SettingsList
								key={`water-${idx}`}
								iconBgColor="#3b82f6"
								leftIcon={<MaterialIcons name="water" size={22} color="#ffffff" />}
								label={f.name ?? f.waterway ?? f.class ?? `Gewässer ${idx + 1}`}
								value={JSON.stringify(f)}
								groupPosition={waterways.length === 1 ? 'single' : idx === 0 ? 'first' : idx === waterways.length - 1 ? 'last' : 'middle'}
							/>
						))}
					</>
				)}

				{buildings.length > 0 && (
					<>
						<SettingsListGroupTitle title="Gebäude" />
						{buildings.map((f, idx) => (
							<SettingsList
								key={`building-${idx}`}
								iconBgColor="#8b5cf6"
								leftIcon={<MaterialIcons name="apartment" size={22} color="#ffffff" />}
								label={f.name ?? f.building ?? f.class ?? `Gebäude ${idx + 1}`}
								value={JSON.stringify(f)}
								groupPosition={buildings.length === 1 ? 'single' : idx === 0 ? 'first' : idx === buildings.length - 1 ? 'last' : 'middle'}
							/>
						))}
					</>
				)}

				{pois.length > 0 && (
					<>
						<SettingsListGroupTitle title="Points of Interest" />
						{pois.map((f, idx) => (
							<SettingsList
								key={`poi-${idx}`}
								iconBgColor="#10b981"
								leftIcon={<MaterialIcons name="place" size={22} color="#ffffff" />}
								label={f.name ?? f.amenity ?? f.natural ?? f.landuse ?? f.subclass ?? f.class ?? `POI ${idx + 1}`}
								value={JSON.stringify(f)}
								groupPosition={pois.length === 1 ? 'single' : idx === 0 ? 'first' : idx === pois.length - 1 ? 'last' : 'middle'}
							/>
						))}
					</>
				)}

				{features && features.length > 0 && (
					<>
						<SettingsListGroupTitle title="Alle Features (JSON)" />
						<TouchableOpacity
							style={[styles.copyButton, { backgroundColor: '#374151' }]}
							onPress={handleCopyJson}
							activeOpacity={0.8}
						>
							<MaterialIcons name="content-copy" size={18} color="#ffffff" />
							<Text style={styles.copyButtonText}>JSON kopieren</Text>
						</TouchableOpacity>
						<View style={[styles.jsonContainer, { backgroundColor: theme.screen.foreground }]}>
							<Text style={[styles.jsonText, { color: theme.screen.textColor }]} selectable>
								{JSON.stringify(features, null, 2)}
							</Text>
						</View>
					</>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingVertical: 16,
	},
	reloadButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginHorizontal: 16,
		marginVertical: 8,
		paddingVertical: 10,
		borderRadius: 10,
	},
	reloadButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	copyButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginHorizontal: 16,
		marginVertical: 8,
		paddingVertical: 10,
		borderRadius: 10,
	},
	copyButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	loadingContainer: {
		alignItems: 'center',
		paddingVertical: 32,
		gap: 12,
	},
	loadingText: {
		fontSize: 14,
	},
	errorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	errorText: {
		color: '#ef4444',
		fontSize: 14,
		flex: 1,
	},
	jsonContainer: {
		marginHorizontal: 16,
		padding: 12,
		borderRadius: 8,
	},
	jsonText: {
		fontSize: 11,
		fontFamily: 'monospace',
	},
});
