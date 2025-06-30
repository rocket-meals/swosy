import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';

export interface Position {
  lat: number;
  lng: number;
}

export interface MyMapProps {
  mapCenterPosition: Position;
  zoom?: number;
  mapMarkers?: { id: string; position: Position; title?: string; icon?: string }[];
}

const MyMap: React.FC<MyMapProps> = ({ mapCenterPosition, zoom, mapMarkers }) => {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const html = require('@/assets/leaflet/index.html');

  const defaultLayer = {
    layerType: 'TileLayer',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    baseLayerName: 'OpenStreetMap',
    baseLayerIsChecked: true,
  };

  const sendCoordinates = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const message = {
        mapCenterPosition,
        zoom: zoom ?? 13,
        mapLayers: [defaultLayer],
        mapMarkers: mapMarkers ?? [],
      };
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, [mapCenterPosition, zoom, mapMarkers]);

  useEffect(() => {
    sendCoordinates();
  }, [sendCoordinates]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.tag === 'MapComponentMounted') {
          sendCoordinates();
        }
      } catch {
        // ignore malformed messages
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendCoordinates]);

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <iframe
        ref={iframeRef}
        src={html}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onLoad={sendCoordinates}
        title="map"
      />
    </View>
  );
};

export default MyMap;
