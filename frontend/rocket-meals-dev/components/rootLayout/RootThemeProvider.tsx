import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import React from 'react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootThemeProviderProps {
    children?: React.ReactNode;
}
export const RootThemeProvider = (props: RootThemeProviderProps) => {
  const colorScheme = "dark";

  return(
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {/* Render the children */}
            {props?.children}
      </ThemeProvider>
  )
}