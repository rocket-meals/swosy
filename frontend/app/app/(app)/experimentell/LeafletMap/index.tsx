import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const LeafletMap = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);
  const { theme } = useTheme();

  const html = require('@/assets/leaflet/index.html');

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <WebView
        originWhitelist={['*']}
        source={html}
        style={styles.webview}
      />
    </View>
  );
};

export default LeafletMap;
