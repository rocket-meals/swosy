import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

export default function Layout() {
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
          title: 'Vertical Image Scroll',
          header: () => (
            <CustomStackHeader
              label={translate(TranslationKeys.vertical_image_scroll)}
              key={'vertical_image_scroll'}
            />
          ),
        }}
      />
    </Stack>
  );
}
