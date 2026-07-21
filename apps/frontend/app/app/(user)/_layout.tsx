import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';
import TranslatedStackHeader from '@/components/CustomStackHeader/TranslatedStackHeader';
import { TranslationKeys } from '@/locales/keys';

// `Stack.Screen`'s `options.header` calls this as a plain function (never as
// a JSX tag), so a factory returning a stable function avoids defining a new
// arrow (and thus a new "component") on every render.
function makeTranslatedStackHeader(labelKey: TranslationKeys, headerKey?: string) {
	return () => <TranslatedStackHeader labelKey={labelKey} headerKey={headerKey} />;
}

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
				name="delete-user/index"
				options={{
					header: makeTranslatedStackHeader(TranslationKeys.account_delete, 'account_delete'),
				}}
			/>
		</Stack>
	);
}
