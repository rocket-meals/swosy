import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';
import TranslatedStackHeader from '@/components/CustomStackHeader/TranslatedStackHeader';
import { TranslationKeys } from '@/locales/keys';

export default function FoodOfferLayout() {
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
					title: 'list-week-screen',
					header: () => <TranslatedStackHeader labelKey={TranslationKeys.Food_Plan_Week} />,
				}}
			/>
			<Stack.Screen
				name="details/index"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
