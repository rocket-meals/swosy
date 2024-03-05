import React from 'react';
import {ThemeProvider} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {ErrorBoundary} from 'expo-router';
import {useViewBackgroundColor, View} from "@/components/Themed"; // Import View from your themed components
import {MyGlobalActionSheet, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {RootFabHolder} from "@/components/rootLayout/RootFabHolder";
import {useThemeDetermined, useIsDarkTheme} from "@/states/ColorScheme";

export interface RootThemeProviderProps {
    children?: React.ReactNode;
}

export const RootThemeProvider = (props: RootThemeProviderProps) => {
    const theme = useThemeDetermined();
    const isDarkTheme = useIsDarkTheme();
    const statusbarTextColorStyle = isDarkTheme ? "light" : "dark";
    const [show, hide, showActionsheetConfig, visible] = useMyGlobalActionSheet();
    const backgroundColor = useViewBackgroundColor();

    return(
        <ThemeProvider value={theme}>
            <StatusBar style={statusbarTextColorStyle} />
            {/* Set View to occupy all available space and control accessibility based on action sheet visibility */}
            <View style={{height: "100%", width: "100%", backgroundColor: backgroundColor}} accessible={!visible} accessibilityElementsHidden={visible}>
              {/* Render the children respecting the action sheet's visibility */}
              {props.children}
            </View>
            <RootFabHolder />
            <MyGlobalActionSheet />
        </ThemeProvider>
    );
}
