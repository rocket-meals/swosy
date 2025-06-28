import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import CustomMenuHeader from '@/components/CustomMenuHeader/CustomMenuHeader';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

export default function ExperimentalLayout() {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.header.background },
        headerTintColor: theme.header.text,
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: 'Experimental',
          header: () => (
            <CustomMenuHeader
              label={translate(TranslationKeys.experimental)}
              key={'Experimental'}
            />
          ),
        }}
      />
      <Stack.Screen
        name='leaflet-map'
        options={{
          title: 'Leaflet Map',
          header: () => (
            <CustomStackHeader
              label={translate(TranslationKeys.leaflet_map)}
              key={'LeafletMap'}
            />
          ),
        }}
      />
    </Stack>
  );
}
