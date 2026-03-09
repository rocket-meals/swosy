import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import MyMap from '@/components/MyMap/MyMap';
import { MapLayer, MapMarker } from '@/components/MyMap/model';
import { MyMapMarkerIcons } from '@/components/MyMap/markerUtils';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { DatabaseTypes } from 'repo-depkit-common';
import { StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

type TileVariant = {
	key: string;
	label: string;
	layer: MapLayer;
};

const TILE_VARIANTS: TileVariant[] = [
	{
		key: 'osm',
		label: 'OpenStreetMap',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			baseLayerName: 'OpenStreetMap',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'otm',
		label: 'OpenTopoMap',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
			baseLayerName: 'OpenTopoMap',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'carto-light',
		label: 'CartoDB Light',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
			baseLayerName: 'CartoDB Light',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'carto-dark',
		label: 'CartoDB Dark',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
			baseLayerName: 'CartoDB Dark',
			baseLayerIsChecked: true,
		},
	},
	{
		key: 'osm-hot',
		label: 'OSM Humanitarian',
		layer: {
			layerType: 'TileLayer',
			url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
			baseLayerName: 'OSM Humanitarian',
			baseLayerIsChecked: true,
		},
	},
];

type BuildingCoordinates = { coordinates?: [number, number] } | null;

const FALLBACK_CENTER = { lat: 52.275, lng: 7.4584 };

const MapVariantsPage: React.FC = () => {
	useSetPageTitle(TranslationKeys.map_variants);
	const { theme } = useTheme();
	const { buildings } = useAppSelector((state) => state.canteenReducer);
	const selectedCanteen = useSelectedCanteen();

	const [selectedVariantKey, setSelectedVariantKey] = useState<string>(TILE_VARIANTS[0].key);
	const [markerIconSrc, setMarkerIconSrc] = React.useState<string | null>(null);

	React.useEffect(() => {
		let isMounted = true;
		const loadIcon = async () => {
			try {
				const asset = Asset.fromModule(require('@/assets/map/marker-icon-2x.png'));
				await asset.downloadAsync();
				if (Platform.OS === 'web') {
					if (isMounted) setMarkerIconSrc(asset.uri);
				} else if (asset.localUri) {
					const content = await FileSystem.readAsStringAsync(asset.localUri, {
						encoding: FileSystem.EncodingType.Base64,
					});
					if (isMounted) setMarkerIconSrc(`data:image/png;base64,${content}`);
				}
			} catch {
				// marker icon loading failed, fall through without icon
			}
		};
		loadIcon();
		return () => {
			isMounted = false;
		};
	}, []);

	const centerPosition = useMemo(() => {
		if (selectedCanteen?.building) {
			const building = buildings.find((b: DatabaseTypes.Buildings) => b.id === selectedCanteen.building);
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			if (coords && coords.length === 2) {
				return { lat: Number(coords[1]), lng: Number(coords[0]) };
			}
		}
		return FALLBACK_CENTER;
	}, [selectedCanteen, buildings]);

	const buildingMarkers = useMemo((): MapMarker[] => {
		return (buildings as DatabaseTypes.Buildings[])
			.filter((b) => {
				const coords = (b?.coordinates as BuildingCoordinates)?.coordinates;
				return coords && coords.length === 2;
			})
			.map((b) => {
				const coords = (b.coordinates as BuildingCoordinates)!.coordinates!;
				const icon = markerIconSrc ? MyMapMarkerIcons.getIconForWebByLocalPathUri(markerIconSrc) : undefined;
				return {
					id: `bld-${b.id}`,
					position: { lat: Number(coords[1]), lng: Number(coords[0]) },
					icon,
					size: [32, 32] as [number, number],
					title: b.alias ?? b.id,
				};
			});
	}, [buildings, markerIconSrc]);

	const selectedVariant = TILE_VARIANTS.find((v) => v.key === selectedVariantKey) ?? TILE_VARIANTS[0];

	return (
		<View style={[styles.root, { backgroundColor: theme.screen.background }]}>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
				{TILE_VARIANTS.map((variant) => {
					const isActive = variant.key === selectedVariantKey;
					return (
						<TouchableOpacity
							key={variant.key}
							onPress={() => setSelectedVariantKey(variant.key)}
							style={[
								styles.tab,
								{
									backgroundColor: isActive ? theme.button.background : theme.screen.background,
									borderColor: theme.button.background,
								},
							]}
						>
							<Text style={[styles.tabText, { color: isActive ? theme.button.text : theme.screen.text }]}>{variant.label}</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>
			<View style={styles.mapContainer}>
				<MyMap
					key={selectedVariant.key}
					mapCenterPosition={centerPosition}
					zoom={13}
					mapMarkers={buildingMarkers}
					mapLayers={[selectedVariant.layer]}
				/>
			</View>
		</View>
	);
};

export default MapVariantsPage;

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	tabBar: {
		flexDirection: 'row',
		paddingHorizontal: 12,
		paddingVertical: 8,
		gap: 8,
	},
	tab: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
	},
	tabText: {
		fontSize: 13,
		fontFamily: 'Poppins_600SemiBold',
	},
	mapContainer: {
		flex: 1,
	},
});
