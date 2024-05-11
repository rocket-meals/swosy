import React, {useEffect} from 'react';
import {
	MyColorSchemeKey, useIsDarkTheme,
	useMyColorSchemeKeySavedOption
} from '@/states/ColorScheme';
import {Icon, View, Text} from '@/components/Themed';
import {MyFab} from '@/components/fab/MyFab';
import {useIsDeveloperModeActive} from '@/states/Develop';
import {useNavigation} from "expo-router";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MyButton} from "@/components/buttons/MyButton";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export interface RootFabHolderProps {
    children?: React.ReactNode;
}

const HistoryFab = () => {
	const navigation = useNavigation()

	return (
		<MyFab
			accessibilityLabel={'history'}
		>
			<View style={{
				width: 400,
				height: 200,
				backgroundColor: 'white',
			}}>
				<MyButton accessibilityLabel={'history'} onPress={() => {
					console.log(navigation.getState());
				}} text={'History'} />
			</View>
		</MyFab>
	)
}

const DevelopThemeSwitch = () => {
	const [savedColorSchemeOptionRaw, setColorSchemeOptionRaw] = useMyColorSchemeKeySavedOption()
	const isDarkMode = useIsDarkTheme()

	return (
		<MyFab key={'develop-theme-switch'}
			style={{backgroundColor: 'red'}}
			accessibilityLabel={'themeSwitcher'}
			onPress={() => {
				if (isDarkMode) {
					setColorSchemeOptionRaw(MyColorSchemeKey.Light)
				} else {
					setColorSchemeOptionRaw(MyColorSchemeKey.Dark)
				}
			}}
		>
			<Icon name={'theme-light-dark'} size={24} />
		</MyFab>
	)
}

export const RootFabHolder = (props: RootFabHolderProps) => {
	const isDevelopMode = useIsDeveloperModeActive();

	const developHelperComponents = []
	if (isDevelopMode) {
		developHelperComponents.push(<DevelopThemeSwitch />)
	}

	return (
		<View style={{position: 'absolute', bottom: 0, right: 0}}>
			{/* Render the children */}
			{props?.children}
			{developHelperComponents}
		</View>
	)
}