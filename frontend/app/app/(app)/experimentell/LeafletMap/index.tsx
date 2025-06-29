import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { RootState } from '@/redux/reducer';
import MyMap from '@/components/MyMap/MyMap';

const DEFAULT_POSITION = { lat: 52.52, lng: 13.405 };

const LeafletMap = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);

  const { selectedCanteen, buildings } = useSelector(
    (state: RootState) => state.canteenReducer
  );

  const position = useMemo(() => {
    if (selectedCanteen?.building) {
      const building = buildings.find((b) => b.id === selectedCanteen.building);
      const coords = (building as any)?.coordinates?.coordinates;
      if (coords && coords.length === 2) {
        return { lat: Number(coords[1]), lng: Number(coords[0]) };
      }
    }
    return DEFAULT_POSITION;
  }, [selectedCanteen, buildings]);

  return <MyMap latitude={position.lat} longitude={position.lng} />;
};

export default LeafletMap;
