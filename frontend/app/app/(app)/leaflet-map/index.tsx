import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { RootState } from '@/redux/reducer';
import MyMap from '@/components/MyMap/MyMap';
import {
  MARKER_DEFAULT_SIZE,
  MyMapMarkerIcons,
  getDefaultIconAnchor,
} from '@/components/MyMap/markerUtils';

const POSITION_BUNDESTAG = {
  lat: 52.518594247456804,
  lng: 13.376281624711964,
};

const LeafletMap = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);

  const { selectedCanteen, buildings } = useSelector(
    (state: RootState) => state.canteenReducer
  );

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

  const markers = [
    {
      id: 'example',
      position: POSITION_BUNDESTAG,
      icon: MyMapMarkerIcons.DEBUG_ICON,
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
    />
  );
};

export default LeafletMap;
