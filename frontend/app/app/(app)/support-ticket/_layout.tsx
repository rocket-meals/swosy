import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useLanguage } from '@/hooks/useLanguage';

export default function Layout() {
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
          title: 'Support Ticket',
          header: () => (
            <CustomStackHeader
              label={t('my_support_tickets')}
              key={'Support Ticket'}
            />
          ),
        }}
      />
    </Stack>
  );
}
