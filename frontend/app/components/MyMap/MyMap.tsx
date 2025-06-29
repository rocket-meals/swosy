import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';

export interface Position {
  lat: number;
  lng: number;
}

export interface MyMapProps {
  mapCenterPosition: Position;
  zoom?: number;
  mapMarkers?: { id: string; position: Position; title?: string; icon?: string; }[];
}

const MyMap: React.FC<MyMapProps> = ({ mapCenterPosition, zoom, mapMarkers }) => {
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const html = require('@/assets/leaflet/index.html');

  const defaultLayer = {
    layerType: 'TileLayer',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    baseLayerName: 'OpenStreetMap',
    baseLayerIsChecked: true,
  };

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.tag === 'MapComponentMounted') {
          sendCoordinates();
        }
      } catch {
        // ignore malformed messages
      }
    },
    [sendCoordinates]
  );

  const sendCoordinates = useCallback(() => {
    if (webViewRef.current) {
      const message = {
        mapCenterPosition,
        zoom: zoom ?? 13,
        mapLayers: [defaultLayer],
        mapMarkers: mapMarkers ?? [],
      };
      const js = `window.postMessage(${JSON.stringify(message)}, '*');`;
      webViewRef.current.injectJavaScript(js);
    }
  }, [mapCenterPosition, zoom, mapMarkers]);

  useEffect(() => {
    sendCoordinates();
  }, [sendCoordinates]);

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={html}
        style={styles.webview}
        onMessage={handleMessage}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        domStorageEnabled
        javaScriptEnabled
        containerStyle={{ height: '100%', width: '100%' }}
        onLoadEnd={sendCoordinates}
      />
    </View>
  );
};

export default MyMap;
