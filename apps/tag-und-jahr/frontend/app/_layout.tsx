import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Drawer, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { ColorValue, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CLOCK_COLORS } from '../helpers/clockDesign';
import { getVersionInternalForAppsettingsScreen } from '../config';

function makeDrawerIcon(name: keyof typeof Ionicons.glyphMap) {
	return ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color} />;
}

// Default drawer content plus the app version at the very bottom, below the
// menu entries - the same value the other apps show in their settings screen,
// so users can verify which OTA update they are running.
function DrawerContent(props: DrawerContentComponentProps) {
	return (
		<DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
			<DrawerItemList {...props} />
			<Text style={styles.version}>{`v${getVersionInternalForAppsettingsScreen()}`}</Text>
		</DrawerContentScrollView>
	);
}

export default function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<StatusBar style="light" />
			<Drawer
				drawerContent={(props) => <DrawerContent {...props} />}
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

const styles = StyleSheet.create({
	drawerContent: {
		flexGrow: 1,
		justifyContent: 'space-between',
	},
	version: {
		marginTop: 10,
		paddingHorizontal: 16,
		paddingBottom: 16,
		fontSize: 12,
		color: CLOCK_COLORS.background,
		opacity: 0.8,
		textAlign: 'center',
	},
});
