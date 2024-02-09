import {ThemeProvider} from '@react-navigation/native';
import React from 'react';
import {useThemeDetermined} from "@/states/ColorScheme";
import {MyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {RootFabHolder} from "@/components/rootLayout/RootFabHolder";

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
            <RootFabHolder />
            <MyGlobalActionSheet />
      </ThemeProvider>
  )
}