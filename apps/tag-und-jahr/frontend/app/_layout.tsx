import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { ColorValue } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CLOCK_COLORS } from '../helpers/clockDesign';

function makeDrawerIcon(name: keyof typeof Ionicons.glyphMap) {
	return ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color} />;
}

export default function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<StatusBar style="light" />
			<Drawer
				screenOptions={{
					headerStyle: { backgroundColor: CLOCK_COLORS.background },
					headerTintColor: '#e8ebf1',
					headerShadowVisible: false,
					drawerActiveTintColor: CLOCK_COLORS.yearDisc,
					drawerType: 'front',
					sceneStyle: { backgroundColor: CLOCK_COLORS.background },
				}}
			>
				<Drawer.Screen
					name="index"
					options={{
						title: 'Tag und Jahr',
						drawerLabel: 'Uhr',
						drawerIcon: makeDrawerIcon('time-outline'),
					}}
				/>
				<Drawer.Screen
					name="settings/index"
					options={{
						title: 'Einstellungen',
						drawerLabel: 'Einstellungen',
						drawerIcon: makeDrawerIcon('settings-outline'),
					}}
				/>
			</Drawer>
		</GestureHandlerRootView>
	);
}
