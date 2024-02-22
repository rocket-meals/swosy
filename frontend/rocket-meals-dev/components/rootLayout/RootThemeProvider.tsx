import {ThemeProvider} from '@react-navigation/native';
import React from 'react';
import {useThemeDetermined, useIsDarkTheme} from "@/states/ColorScheme";
import {MyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {RootFabHolder} from "@/components/rootLayout/RootFabHolder";
import { StatusBar } from 'expo-status-bar';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export interface RootThemeProviderProps {
    children?: React.ReactNode;
}
export const RootThemeProvider = (props: RootThemeProviderProps) => {
    const theme = useThemeDetermined()
    const isDarkTheme = useIsDarkTheme()

    const statusbarTextColorStyle = isDarkTheme ? "light" : "dark"

  return(
      <ThemeProvider value={theme}>
            <StatusBar style={statusbarTextColorStyle} />
            {/* Render the children */}
            {props?.children}
            <RootFabHolder />
            <MyGlobalActionSheet />
      </ThemeProvider>
  )
}
