import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useLanguage } from '@/hooks/useLanguage';

export default function FoodOfferLayout() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
          title: 'list-week-screen',
          header: () => <CustomStackHeader label={t('Food Plan:Week')} />,
        }}
      />
      <Stack.Screen
        name='details/index'
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
