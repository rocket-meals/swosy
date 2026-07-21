import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';
import TranslatedStackHeader from '@/components/CustomStackHeader/TranslatedStackHeader';
import { TranslationKeys } from '@/locales/keys';

export default function Layout() {
	const { theme } = useTheme();
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: theme.header.background },
				headerTintColor: theme.header.text,
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: 'Support Ticket',
					header: () => <TranslatedStackHeader labelKey={TranslationKeys.my_support_tickets} headerKey={'Support Ticket'} />,
				}}
			/>
		</Stack>
	);
}
