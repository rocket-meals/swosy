import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { useTheme } from '@/hooks/useTheme';
import TranslatedStackHeader from '@/components/CustomStackHeader/TranslatedStackHeader';
import { TranslationKeys } from '@/locales/keys';
import { AppSettingsHelper } from '@/redux/actions/AppSettings/AppSettings';
import { SET_APP_SETTINGS } from '@/redux/Types/types';
import { useAppSelector } from '@/redux/hooks';

// `Stack.Screen`'s `options.header` calls this as a plain function (never as
// a JSX tag), so a factory returning a stable function avoids defining a new
// arrow (and thus a new "component") on every render.
function makeTranslatedStackHeader(labelKey: TranslationKeys, headerKey?: string) {
	return () => <TranslatedStackHeader labelKey={labelKey} headerKey={headerKey} />;
}

/**
 * Public screens: reachable by link without logging in, unlike everything under `(app)`.
 * The app settings (store links, ...) are loaded here because the `(app)` layout that
 * normally loads them is skipped when a public link is opened directly.
 */
export default function PublicLayout() {
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { appSettings } = useAppSelector((state) => state.settings);

	useEffect(() => {
		if (Object.keys(appSettings || {}).length) {
			return;
		}
		new AppSettingsHelper()
			.fetchAppSettings({})
			.then((result) => {
				if (result) {
					dispatch({ type: SET_APP_SETTINGS, payload: result as DatabaseTypes.AppSettings });
				}
			})
			.catch((error) => console.error('Could not load app settings for a public screen:', error));
	}, []);

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: theme.header.background },
				headerTintColor: theme.header.text,
			}}
		>
			<Stack.Screen
				name="give-feedback/index"
				options={{
					header: makeTranslatedStackHeader(TranslationKeys.rueckmeldung_geben, 'rueckmeldung_geben'),
				}}
			/>
			<Stack.Screen
				name="app-download/index"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="app-download-management/index"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="mcp-instruction/index"
				options={{
					header: makeTranslatedStackHeader(TranslationKeys.mcp_instruction, 'mcp_instruction'),
				}}
			/>
		</Stack>
	);
}
