import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const LeafletMap = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);
  const { theme } = useTheme();
  const { translate } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: theme.screen.background }]}>
      <Text style={[styles.text, { color: theme.screen.text }]}>\n        {translate(TranslationKeys.leaflet_map)} Placeholder\n      </Text>
    </View>
  );
};

export default LeafletMap;
