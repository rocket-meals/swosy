import 'setimmediate';
import React, { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, AppDrawer, DrawerItem, ModalProvider, SettingsProvider } from 'repo-depkit-common-ui';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { loadPersistedState } from '../store/hexTileSlice';
import { loadHexTileState } from '../helpers/HexTileStorage';

// ─── Error Boundary ───────────────────────────────────────────────────────────

type ErrorBoundaryState = { hasError: boolean; error: Error | null };

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error('[AppErrorBoundary] Caught error:', error);
		console.error('[AppErrorBoundary] Component stack:', info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			const { error } = this.state;
			return (
				<View style={styles.errorContainer}>
					<Modal visible transparent animationType="slide" accessibilityViewIsModal>
						<View style={styles.errorOverlay}>
							<View style={styles.errorSheet}>
								<Text style={styles.errorTitle}>🚨 App Error</Text>
								<Text style={styles.errorSubtitle}>{error?.name ?? 'Error'}</Text>
								<ScrollView style={styles.errorScroll}>
									<Text style={styles.errorMessage}>{error?.message ?? 'An unexpected error occurred.'}</Text>
									{Boolean(error?.stack) && (
										<Text style={styles.errorStack}>{error?.stack}</Text>
									)}
								</ScrollView>
								<TouchableOpacity
									accessibilityRole="button"
									accessibilityLabel="Dismiss error"
									style={styles.errorButton}
									onPress={() => this.setState({ hasError: false, error: null })}
								>
									<Text style={styles.errorButtonText}>Dismiss</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>
				</View>
			);
		}
		return this.props.children;
	}
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
	const activeKey = props.state.routes[props.state.index].name;

	const items: DrawerItem[] = [
		{
			key: 'index',
			label: 'Record',
			renderIcon: (_, color) => <Ionicons name="radio-button-on-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('index'),
		},
		{
			key: 'activities/index',
			label: 'Activities',
			renderIcon: (_, color) => <Ionicons name="list-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('activities/index'),
		},
		{
			key: 'settings/index',
			label: 'Settings',
			renderIcon: (_, color) => <Ionicons name="settings-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('settings/index'),
		},
	];

	return (
		<AppDrawer
			renderLogo={() => (
				<View style={styles.logoRow}>
					<Ionicons name="location-sharp" size={32} color="#2563eb" />
					<Text style={styles.logoTitle}>Geonexia</Text>
				</View>
			)}
			items={items}
			activeKey={activeKey}
			primaryColor="#2563eb"
		/>
	);
}

export default function Layout() {
	useEffect(() => {
		loadHexTileState()
			.then((records) => {
				store.dispatch(loadPersistedState(records));
			})
			.catch((err) => {
				console.warn('[Layout] Failed to load persisted hex tile state:', err);
			});
	}, []);

	return (
		<Provider store={store}>
		<AppErrorBoundary>
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					<SettingsProvider primaryColor="#2563eb">
						<ModalProvider>
						<StatusBar style="auto" />
						<Drawer
							drawerContent={(props) => <CustomDrawerContent {...props} />}
							screenOptions={{
								drawerActiveTintColor: '#2563eb',
							}}
						>
							<Drawer.Screen
								name="index"
								options={{
									title: 'Record',
									drawerIcon: ({ color, size }) => (
										<Ionicons name="radio-button-on-outline" size={size} color={color} />
									),
								}}
							/>
							<Drawer.Screen
								name="activities/index"
								options={{
									title: 'Activities',
									drawerIcon: ({ color, size }) => (
										<Ionicons name="list-outline" size={size} color={color} />
									),
								}}
							/>
							<Drawer.Screen
								name="activities/[id]"
								options={{
									title: 'Activity',
									drawerItemStyle: { display: 'none' },
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
						</ModalProvider>
					</SettingsProvider>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
		</AppErrorBoundary>
		</Provider>
	);
}

const styles = StyleSheet.create({
	logoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	logoTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111111',
	},
	errorContainer: {
		flex: 1,
		backgroundColor: '#fff',
	},
	errorOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'flex-end',
	},
	errorSheet: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		padding: 20,
		maxHeight: '80%',
	},
	errorTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#b91c1c',
		marginBottom: 4,
	},
	errorSubtitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 12,
	},
	errorScroll: {
		maxHeight: 300,
		marginBottom: 16,
	},
	errorMessage: {
		fontSize: 14,
		color: '#374151',
		marginBottom: 8,
	},
	errorStack: {
		fontSize: 11,
		color: '#6b7280',
		fontFamily: 'monospace',
	},
	errorButton: {
		backgroundColor: '#2563eb',
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: 'center',
	},
	errorButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 15,
	},
});
