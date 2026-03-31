import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, SettingsListNumberInput, useTheme } from 'repo-depkit-common-ui';

import { isAvailable as isH3Available, cellToLatLng, cellToBoundary, getResolution, isValidCell } from '../../../helpers/H3Helper';
import { getTilesForBounds, resolveTileUrl, fetchAndParseTile } from '../../../helpers/TileFeatureHelper';
import type { MapFeatureInfo } from '../../../helpers/RouteNameSuggestionHelper';

const HEX_ID = '8a1f10d5061ffff';
const DEFAULT_ZOOM = 14;
const EXPERIMENTAL_COLOR = '#7c3aed';

type DebugInfo = {
	tileUrlTemplate: string | null;
	tileCoords: Array<{ z: number; x: number; y: number }>;
	tileFetchResults: Array<{
		coord: string;
		status: 'ok' | 'error';
		featureCount: number;
		errorMessage?: string;
	}>;
};

export default function HexTileInfoScreen() {
	const { theme } = useTheme();
	const [zoom, setZoom] = useState(DEFAULT_ZOOM);
	const [features, setFeatures] = useState<MapFeatureInfo[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [debug, setDebug] = useState<DebugInfo | null>(null);
	const runIdRef = useRef(0);

	const fetchFeatures = useCallback(async (queryZoom: number) => {
		const runId = ++runIdRef.current;

		setLoading(true);
		setError(null);
		setFeatures(null);
		setDebug(null);

		const debugInfo: DebugInfo = {
			tileUrlTemplate: null,
			tileCoords: [],
			tileFetchResults: [],
		};

		try {
			if (!isH3Available()) {
				throw new Error('H3 Bibliothek nicht verfügbar');
			}
			if (!isValidCell(HEX_ID)) {
				throw new Error(`Ungültige H3 Zelle: ${HEX_ID}`);
			}

			// Step 1: Resolve tile URL template
			const tileUrlTemplate = await resolveTileUrl();
			if (runId !== runIdRef.current) return;
			debugInfo.tileUrlTemplate = tileUrlTemplate;

			// Step 2: Compute bounding box and tile coordinates
			const boundary = cellToBoundary(HEX_ID);
			const lats = boundary.map((v: [number, number]) => v[0]);
			const lngs = boundary.map((v: [number, number]) => v[1]);
			const minLat = Math.min(...lats);
			const minLng = Math.min(...lngs);
			const maxLat = Math.max(...lats);
			const maxLng = Math.max(...lngs);

			const tiles = getTilesForBounds(minLat, minLng, maxLat, maxLng, queryZoom);
			debugInfo.tileCoords = tiles;

			if (runId !== runIdRef.current) return;
			setDebug({ ...debugInfo });

			// Step 3: Fetch and parse each tile individually
			const allFeatures: MapFeatureInfo[] = [];
			for (const t of tiles) {
				const coordStr = `${t.z}/${t.x}/${t.y}`;
				try {
					const tileFeatures = await fetchAndParseTile(tileUrlTemplate, t.z, t.x, t.y);
					debugInfo.tileFetchResults.push({
						coord: coordStr,
						status: 'ok',
						featureCount: tileFeatures.length,
					});
					allFeatures.push(...tileFeatures);
				} catch (tileErr) {
					debugInfo.tileFetchResults.push({
						coord: coordStr,
						status: 'error',
						featureCount: 0,
						errorMessage: tileErr instanceof Error ? tileErr.message : String(tileErr),
					});
				}
				if (runId !== runIdRef.current) return;
				setDebug({ ...debugInfo });
			}

			if (runId !== runIdRef.current) return;
			setFeatures(allFeatures);
		} catch (err) {
			if (runId !== runIdRef.current) return;
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			if (runId === runIdRef.current) {
				setDebug({ ...debugInfo });
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		fetchFeatures(zoom);
	}, [zoom, fetchFeatures]);

	const resolution = isH3Available() && isValidCell(HEX_ID) ? getResolution(HEX_ID) : null;
	const center = isH3Available() && isValidCell(HEX_ID) ? cellToLatLng(HEX_ID) : null;

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<SettingsListGroupTitle title="Hex Tile Info" />
				<SettingsList
					iconBgColor={EXPERIMENTAL_COLOR}
					leftIcon={<Ionicons name="hexagon-outline" size={22} color="#ffffff" />}
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

				<SettingsListGroupTitle title={`Features (Zoom ${zoom})`} />

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
					<Text style={[styles.emptyText, { color: theme.screen.textColor }]}>
						Keine Features gefunden.
					</Text>
				)}

				{features && features.map((feat, idx) => (
					<SettingsList
						key={`feature-${idx}`}
						iconBgColor={feat.name ? '#2563eb' : '#6b7280'}
						leftIcon={<Ionicons name="layers-outline" size={22} color="#ffffff" />}
						label={feat.layerId ?? 'Unbekannter Layer'}
						value={[
							feat.name && `Name: ${feat.name}`,
							feat.class && `Klasse: ${feat.class}`,
							feat.subclass && `Subklasse: ${feat.subclass}`,
							feat.highway && `Highway: ${feat.highway}`,
							feat.waterway && `Waterway: ${feat.waterway}`,
							feat.building && `Building: ${feat.building}`,
							feat.natural && `Natural: ${feat.natural}`,
							feat.landuse && `Landuse: ${feat.landuse}`,
							feat.amenity && `Amenity: ${feat.amenity}`,
						].filter(Boolean).join('\n') || '(keine Eigenschaften)'}
						groupPosition={
							features.length === 1
								? 'single'
								: idx === 0
								? 'first'
								: idx === features.length - 1
								? 'last'
								: 'middle'
						}
					/>
				))}

				{debug && (
					<>
						<SettingsListGroupTitle title="Debug-Info" />
						<SettingsList
							iconBgColor="#6b7280"
							leftIcon={<Ionicons name="link-outline" size={22} color="#ffffff" />}
							label="Tile-URL-Template"
							value={debug.tileUrlTemplate ?? '(nicht aufgelöst)'}
							groupPosition="first"
						/>
						<SettingsList
							iconBgColor="#6b7280"
							leftIcon={<Ionicons name="map-outline" size={22} color="#ffffff" />}
							label="Tile-Koordinaten"
							value={debug.tileCoords.length > 0
								? debug.tileCoords.map((t) => `${t.z}/${t.x}/${t.y}`).join(', ')
								: '(keine Tiles)'}
							groupPosition={debug.tileFetchResults.length > 0 ? 'middle' : 'last'}
						/>
						{debug.tileFetchResults.map((r, idx) => (
							<SettingsList
								key={`debug-tile-${idx}`}
								iconBgColor={r.status === 'ok' ? '#16a34a' : '#ef4444'}
								leftIcon={<Ionicons name={r.status === 'ok' ? 'checkmark-circle-outline' : 'close-circle-outline'} size={22} color="#ffffff" />}
								label={`Tile ${r.coord}`}
								value={r.status === 'ok'
									? `${r.featureCount} Features`
									: `Fehler: ${r.errorMessage ?? 'unbekannt'}`}
								groupPosition={idx === debug.tileFetchResults.length - 1 ? 'last' : 'middle'}
							/>
						))}
					</>
				)}

				{features && (
					<SettingsListGroupTitle title="Rohdaten (JSON)" />
				)}
				{features && (
					<View style={[styles.jsonContainer, { backgroundColor: theme.screen.foreground }]}>
						<Text style={[styles.jsonText, { color: theme.screen.textColor }]}>
							{JSON.stringify(features, null, 2)}
						</Text>
					</View>
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
	emptyText: {
		textAlign: 'center',
		paddingVertical: 16,
		fontSize: 14,
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
