import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { Platform, Text, View } from 'react-native';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import MyMap from '@/components/MyMap/MyMap';
import { getDefaultIconAnchor, MARKER_DEFAULT_SIZE, MyMapMarkerIcons } from '@/components/MyMap/markerUtils';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { MapMarker } from '@/components/MyMap/model';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useTheme } from '@/hooks/useTheme';
import { DatabaseTypes } from 'repo-depkit-common';

type BuildingCoordinates = { coordinates?: [number, number] } | null;

const POSITION_BUNDESTAG = {
	lat: 52.518594247456804,
	lng: 13.376281624711964,
};

const LeafletMap = () => {
	useSetPageTitle(TranslationKeys.leaflet_map);

	const { buildings } = useAppSelector((state) => state.canteenReducer);
	const selectedCanteen = useSelectedCanteen();
	const { show, close } = useMyScrollViewModal();
	const { theme } = useTheme();

	const [markerIconSrc, setMarkerIconSrc] = useState<string | null>(null);
	const [markerError, setMarkerError] = useState<string | null>(null);

	// Load marker asset asynchronously
	useEffect(() => {
		const loadMarkerIcon = async () => {
			try {
				const mapMarkerIcon = require('@/assets/map/marker-icon-2x.png');
				const asset = await Asset.fromModule(mapMarkerIcon);
				await asset.downloadAsync();

				if (Platform.OS === 'web') {
					setMarkerIconSrc(asset.uri);
				} else if (asset.localUri) {
					const content = await FileSystem.readAsStringAsync(asset.localUri, {
						encoding: (FileSystem as any).EncodingType.Base64,
					});
					// Prepend data URL prefix so the HTML <img src=...> works on native WebView
					setMarkerIconSrc(`data:image/png;base64,${content}`);
				} else {
					setMarkerError('marker asset missing localUri');
				}
			} catch (error) {
				console.error('Error loading marker icon:', error);
				setMarkerError(String(error));
			}
		};

		loadMarkerIcon();
	}, []);

	const centerPosition = useMemo(() => {
		if (selectedCanteen?.building) {
			const building = buildings.find((b: DatabaseTypes.Buildings) => b.id === selectedCanteen.building);
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			if (coords && coords.length === 2) {
				return { lat: Number(coords[1]), lng: Number(coords[0]) };
			}
		}
		return POSITION_BUNDESTAG;
	}, [selectedCanteen, buildings]);

	// Build markers for all buildings that have valid coordinates
	const buildingMarkers = useMemo((): MapMarker[] => {
		if (!markerIconSrc) return [];
		return (buildings as DatabaseTypes.Buildings[])
			.filter((building) => {
				const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
				return coords && coords.length === 2;
			})
			.map((building) => {
				const coords = (building.coordinates as BuildingCoordinates)!.coordinates!;
				const [lng, lat] = coords;
				return {
					id: `building-${building.id}`,
					position: { lat: Number(lat), lng: Number(lng) },
					icon: MyMapMarkerIcons.getIconForWebByLocalPathUri(markerIconSrc),
					size: [MARKER_DEFAULT_SIZE, MARKER_DEFAULT_SIZE] as [number, number],
					iconAnchor: getDefaultIconAnchor(MARKER_DEFAULT_SIZE, MARKER_DEFAULT_SIZE),
					title: building.alias ?? building.id,
				};
			});
	}, [buildings, markerIconSrc]);

	const handleMarkerClick = useCallback(
		(id: string) => {
			const buildingId = id.startsWith('building-') ? id.slice('building-'.length) : null;
			const building = buildingId ? (buildings as DatabaseTypes.Buildings[]).find((b) => b.id === buildingId) : null;

			const title = building?.alias ?? id;
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			const lat = coords ? Number(coords[1]).toFixed(5) : null;
			const lng = coords ? Number(coords[0]).toFixed(5) : null;

			show({
				title,
				onClose: close,
				children: (
					<View style={{ padding: 16 }}>
						{lat !== null && lng !== null && (
							<Text style={{ color: theme.screen.text, textAlign: 'center' }}>
								{lat}, {lng}
							</Text>
						)}
					</View>
				),
			});
		},
		[buildings, show, close, theme.screen.text],
	);

	if (!markerIconSrc && !markerError) {
		return null;
	}

	return (
		<View style={{ flex: 1 }}>
			{markerError && <Text selectable>{markerError}</Text>}
			<MyMap mapCenterPosition={centerPosition} mapMarkers={buildingMarkers} onMarkerClick={handleMarkerClick} onMapEvent={(e) => console.log('map event', e.tag)} />
		</View>
	);
};

export default LeafletMap;
