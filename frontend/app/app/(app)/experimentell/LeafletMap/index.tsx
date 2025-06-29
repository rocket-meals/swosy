import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { useLocalSearchParams } from 'expo-router';

const LeafletMap = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);

  const html = require('@/assets/leaflet/index.html');

  const sendCoordinates = useCallback(() => {
    if (webViewRef.current && params.lat && params.lng) {
      const lat = Array.isArray(params.lat) ? params.lat[0] : params.lat;
      const lng = Array.isArray(params.lng) ? params.lng[0] : params.lng;
      const zoomParam = params.zoom ? (Array.isArray(params.zoom) ? params.zoom[0] : params.zoom) : undefined;
      const message = {
        mapCenterPosition: { lat: parseFloat(String(lat)), lng: parseFloat(String(lng)) },
        zoom: zoomParam ? parseInt(String(zoomParam), 10) : 13,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [params.lat, params.lng, params.zoom]);

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

export default LeafletMap;
