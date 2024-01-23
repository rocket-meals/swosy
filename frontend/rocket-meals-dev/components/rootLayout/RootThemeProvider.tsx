import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import React from 'react';
import {Appearance} from "react-native";
import {useMyColorSchemeNameDetermined, useThemeDetermined} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootThemeProviderProps {
    children?: React.ReactNode;
}
export const RootThemeProvider = (props: RootThemeProviderProps) => {
    const theme = useThemeDetermined()

  return(
      <ThemeProvider value={theme}>
            {/* Render the children */}
            {props?.children}
      </ThemeProvider>
  )
}