import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../themes';

type ThemeMode = 'light' | 'dark' | 'systematic';

type ThemeContextType = {
	theme: Theme;
	isDark: boolean;
	setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [mode, setMode] = useState<ThemeMode>('systematic');

	const resolveTheme = (currentMode: ThemeMode): Theme => {
		if (currentMode === 'systematic') {
			return Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme;
		}
		return currentMode === 'dark' ? darkTheme : lightTheme;
	};

	const [theme, setTheme] = useState<Theme>(() => resolveTheme('systematic'));

	const setThemeMode = useCallback((newMode: ThemeMode) => {
		setMode(newMode);
		setTheme(resolveTheme(newMode));
	}, []);

	useEffect(() => {
		setTheme(resolveTheme(mode));

		if (mode === 'systematic') {
			const listener = Appearance.addChangeListener(({ colorScheme }) => {
				if (colorScheme) {
					setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
				}
			});
			return () => listener.remove();
		}

		return undefined;
	}, [mode]);

	const isDark = theme === darkTheme;

	const value = useMemo(
		() => ({ theme, isDark, setThemeMode }),
		[theme, isDark, setThemeMode]
	);

	return (
		<ThemeContext.Provider value={value}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
