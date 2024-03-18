import React from 'react';
import {ThemeProvider} from '@react-navigation/native';
import {StatusBar} from 'expo-status-bar';
import {View, Text, useViewBackgroundColor} from '@/components/Themed'; // Import View from your themed components
import {MyGlobalActionSheet, useMyGlobalActionSheet} from '@/components/actionsheet/MyGlobalActionSheet';
import {RootFabHolder} from '@/components/rootLayout/RootFabHolder';
import {useIsDarkTheme, useThemeDetermined} from '@/states/ColorScheme';
import {useSyncState} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";

export interface RootThemeProviderProps {
    children?: React.ReactNode;
}

export const RootThemeProvider = (props: RootThemeProviderProps) => {
	const theme = useThemeDetermined();
	const isDarkTheme = useIsDarkTheme();
	const statusbarTextColorStyle = isDarkTheme ? 'light' : 'dark';
	const [show, hide, showActionsheetConfig, actionSheetVisible] = useMyGlobalActionSheet();
	const backgroundColor = useViewBackgroundColor();

	const [textDimensions, setTextDimensions] = useSyncState(NonPersistentStore.textDimensions);

	return (
		<ThemeProvider value={theme}>
			<StatusBar style={statusbarTextColorStyle} />
			{/* Set View to occupy all available space and control accessibility based on action sheet visibility */}
			<View style={{height: '100%', width: '100%', backgroundColor: backgroundColor}} accessible={!actionSheetVisible} accessibilityElementsHidden={actionSheetVisible}>
				{/* Render the children respecting the action sheet's visibility */}
				{props.children}
			</View>
			<View style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: 0,
				height: 0,
				overflow: 'hidden',
			}}
				  accessible={false} accessibilityElementsHidden={true}
			>
				<Text onLayout={(event) => {
					const {width, height} = event.nativeEvent.layout;
					setTextDimensions({width, height});
				}}>{"M"}</Text>
			</View>
			<RootFabHolder />
			<MyGlobalActionSheet />
		</ThemeProvider>
	);
}
