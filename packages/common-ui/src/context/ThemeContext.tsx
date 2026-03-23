import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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

	const setThemeMode = (newMode: ThemeMode) => {
		setMode(newMode);
		setTheme(resolveTheme(newMode));
	};

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

	return (
		<ThemeContext.Provider value={{ theme, isDark, setThemeMode }}>
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
