import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';

const LeafletMap = () => {
  useSetPageTitle(TranslationKeys.leaflet_map);
  const { theme } = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.screen.background }} />;
};

export default LeafletMap;
