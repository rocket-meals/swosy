import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Text } from 'react-native';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { RootState } from '@/redux/reducer';
import MyMap from '@/components/MyMap/MyMap';
import {
  MARKER_DEFAULT_SIZE,
  MyMapMarkerIcons,
  getDefaultIconAnchor,
} from '@/components/MyMap/markerUtils';
import { Asset } from 'expo-asset'; // Make sure you import Asset properly

const POSITION_BUNDESTAG = {
  lat: 52.518594247456804,
  lng: 13.376281624711964,
};

const LeafletMap = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);

  const { selectedCanteen, buildings } = useSelector(
      (state: RootState) => state.canteenReducer
  );

  const [markerIconUri, setMarkerIconUri] = useState<string | null>(null);

  // Load marker asset asynchronously
  useEffect(() => {
    const loadMarkerIcon = async () => {
      try {
        const mapMarkerIcon = require('@/assets/map/marker-icon-2x.png');
        const htmlFile = await Asset.fromModule(mapMarkerIcon);
        await htmlFile.downloadAsync();
        setMarkerIconUri(htmlFile.uri);
      } catch (error) {
        console.error('Error loading marker icon:', error);
      }
    };

    loadMarkerIcon();
  }, []);

  const centerPosition = useMemo(() => {
    if (selectedCanteen?.building) {
      const building = buildings.find((b) => b.id === selectedCanteen.building);
      const coords = (building as any)?.coordinates?.coordinates;
      if (coords && coords.length === 2) {
        return { lat: Number(coords[1]), lng: Number(coords[0]) };
      }
    }
    return undefined;
  }, [selectedCanteen, buildings]);

  if (!markerIconUri) {
    // Optional: Add a loading spinner or placeholder here
    return null;
  }

  const markers = [
    {
      id: 'example',
      position: POSITION_BUNDESTAG,
      icon: MyMapMarkerIcons.getIconForWebByUri(markerIconUri),
      size: [MARKER_DEFAULT_SIZE, MARKER_DEFAULT_SIZE],
      iconAnchor: getDefaultIconAnchor(
          MARKER_DEFAULT_SIZE,
          MARKER_DEFAULT_SIZE,
      ),
    },
  ];

  return (
    <MyMap
      mapCenterPosition={centerPosition || POSITION_BUNDESTAG}
      mapMarkers={markers}
      onMarkerClick={(id) => console.log('marker clicked', id)}
      onMapEvent={(e) => console.log('map event', e.tag)}
      renderMarkerModal={(id, onClose) => (
        <Text onPress={onClose}>{id}</Text>
      )}
    />
  );
};

export default LeafletMap;
