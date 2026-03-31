import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';

import { isAvailable as isH3Available, cellToLatLng, getResolution, isValidCell } from '../../../helpers/H3Helper';
import { queryTileFeaturesForHexCell } from '../../../helpers/TileFeatureHelper';
import type { MapFeatureInfo } from '../../../helpers/RouteNameSuggestionHelper';

const HEX_ID = '8a1f10d5061ffff';
const FEATURE_QUERY_ZOOM = 14;
const EXPERIMENTAL_COLOR = '#7c3aed';

export default function HexTileInfoScreen() {
	const { theme } = useTheme();
	const [features, setFeatures] = useState<MapFeatureInfo[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				if (!isH3Available()) {
					throw new Error('H3 Bibliothek nicht verfügbar');
				}
				if (!isValidCell(HEX_ID)) {
					throw new Error(`Ungültige H3 Zelle: ${HEX_ID}`);
				}

				const result = await queryTileFeaturesForHexCell(HEX_ID, FEATURE_QUERY_ZOOM);
				if (!cancelled) {
					setFeatures(result);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : String(err));
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		})();

		return () => { cancelled = true; };
	}, []);

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
						groupPosition="last"
					/>
				)}

				<SettingsListGroupTitle title={`Features (Zoom ${FEATURE_QUERY_ZOOM})`} />

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

				{features && features.length === 0 && (
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
