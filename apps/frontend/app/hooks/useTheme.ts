import { useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, StatusBar } from 'react-native';
import { darkTheme, lightTheme } from '@/styles/themes';
import { configureStore } from '@/redux/store';
import { afterRehydration } from '@/helper/afterRehydration';

export const useTheme = () => {
	const [theme, setTheme] = useState(configureStore.getState().settings.selectedTheme);

	const changeTheme = (mode: 'light' | 'dark' | 'systematic') => ({
		type: 'CHANGE_THEME',
		payload: mode,
	});

	const setThemeMode = (mode: 'light' | 'dark' | 'systematic') => {
		configureStore.dispatch(changeTheme(mode));
	};

	const computedTheme = useMemo(() => {
		if (theme === 'systematic') {
			const systemTheme = Appearance.getColorScheme();
			return systemTheme === 'dark' ? darkTheme : lightTheme;
		}
		return theme === 'dark' ? darkTheme : lightTheme;
	}, [theme]);

	useEffect(() => {
		const unsubscribe = configureStore.subscribe(() => {
			setTheme(configureStore.getState().settings.selectedTheme);
		});

		if (theme === 'systematic') {
			const unsubscribeRehydration = afterRehydration(() => {
				configureStore.dispatch(changeTheme('systematic'));
			});

			const listener = Appearance.addChangeListener(({ colorScheme }) => {
				if (colorScheme) {
					afterRehydration(() => configureStore.dispatch(changeTheme('systematic')));
				}
			});

			return () => {
				listener.remove();
				unsubscribeRehydration();
				unsubscribe();
			};
		}

		return () => unsubscribe();
	}, [theme]);

	useEffect(() => {
		const isDark = theme === 'systematic'
			? Appearance.getColorScheme() === 'dark'
			: theme === 'dark';

		StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');

		if (Platform.OS === 'android') {
			StatusBar.setBackgroundColor(computedTheme.header.background);
		}
	}, [theme, computedTheme]);

	return { theme: computedTheme, setThemeMode };
};
