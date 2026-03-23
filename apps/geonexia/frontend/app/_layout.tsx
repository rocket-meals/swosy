import 'setimmediate';
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from 'repo-depkit-common-ui';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function CustomDrawerContent(props: DrawerContentComponentProps) {
	return (
		<DrawerContentScrollView {...props}>
			<View style={styles.drawerHeader}>
				<Ionicons name="location-sharp" size={32} color="#2563eb" />
				<Text style={styles.drawerTitle}>Geonexia</Text>
			</View>
			<DrawerItemList {...props} />
		</DrawerContentScrollView>
	);
}

export default function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					<StatusBar style="auto" />
					<Drawer
						drawerContent={(props) => <CustomDrawerContent {...props} />}
						screenOptions={{
							drawerActiveTintColor: '#2563eb',
							drawerLabelStyle: styles.drawerLabel,
						}}
					>
						<Drawer.Screen
							name="index"
							options={{
								title: 'Home',
								drawerIcon: ({ color, size }) => (
									<Ionicons name="home-outline" size={size} color={color} />
								),
							}}
						/>
						<Drawer.Screen
							name="settings/index"
							options={{
								title: 'Settings',
								drawerIcon: ({ color, size }) => (
									<Ionicons name="settings-outline" size={size} color={color} />
								),
							}}
						/>
					</Drawer>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	drawerHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingHorizontal: 16,
		paddingVertical: 20,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e5e7eb',
		marginBottom: 8,
	},
	drawerTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111111',
	},
	drawerLabel: {
		fontSize: 15,
	},
});
