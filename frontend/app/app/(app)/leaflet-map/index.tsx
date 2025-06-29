import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { RootState } from '@/redux/reducer';
import MyMap from '@/components/MyMap/MyMap';

const MARKERS = [
  { id: '1', position: { lat: 53.7554, lng: 12.0636 }, title: 'Marker 1' },
  { id: '2', position: { lat: 50.3646, lng: 8.0713 }, title: 'Marker 2' },
  { id: '3', position: { lat: 51.0902, lng: 9.2395 }, title: 'Marker 3' },
  { id: '4', position: { lat: 53.2704, lng: 8.4265 }, title: 'Marker 4' },
  { id: '5', position: { lat: 50.8128, lng: 10.6671 }, title: 'Marker 5' },
  { id: '6', position: { lat: 54.2649, lng: 10.0375 }, title: 'Marker 6' },
  { id: '7', position: { lat: 49.2547, lng: 12.0464 }, title: 'Marker 7' },
  { id: '8', position: { lat: 51.947, lng: 8.0041 }, title: 'Marker 8' },
  { id: '9', position: { lat: 54.278, lng: 13.8623 }, title: 'Marker 9' },
  { id: '10', position: { lat: 53.4817, lng: 13.2173 }, title: 'Marker 10' },
  { id: '11', position: { lat: 49.4812, lng: 11.8387 }, title: 'Marker 11' },
  { id: '12', position: { lat: 54.1907, lng: 11.4719 }, title: 'Marker 12' },
  { id: '13', position: { lat: 50.7771, lng: 6.8056 }, title: 'Marker 13' },
  { id: '14', position: { lat: 50.4734, lng: 10.8871 }, title: 'Marker 14' },
  { id: '15', position: { lat: 54.3041, lng: 13.7329 }, title: 'Marker 15' },
  { id: '16', position: { lat: 50.8161, lng: 12.9225 }, title: 'Marker 16' },
  { id: '17', position: { lat: 49.0839, lng: 12.4402 }, title: 'Marker 17' },
  { id: '18', position: { lat: 51.3896, lng: 6.1123 }, title: 'Marker 18' },
  { id: '19', position: { lat: 52.7576, lng: 9.1906 }, title: 'Marker 19' },
  { id: '20', position: { lat: 53.5988, lng: 11.3452 }, title: 'Marker 20' },
];

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

  return (
    <MyMap
      mapCenterPosition={centerPosition || POSITION_BUNDESTAG}
      mapMarkers={MARKERS}
    />
  );
};

export default LeafletMap;
