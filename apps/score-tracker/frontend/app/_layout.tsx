import 'setimmediate';
import React, { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, AppDrawer, DrawerItem, ModalProvider, SettingsProvider, ToastProvider, useTheme } from 'repo-depkit-common-ui';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { store } from '../store/store';
import { loadThemeMode as loadThemeModeAction } from '../store/themeSlice';
import { loadGameState as loadGameStateAction } from '../store/gameSlice';
import { loadFriends as loadFriendsAction } from '../store/friendsSlice';
import { loadGameTypes as loadGameTypesAction } from '../store/gameTypesSlice';
import { loadGameHistory as loadGameHistoryAction } from '../store/gameHistorySlice';
import { loadAppSettings as loadAppSettingsAction } from '../store/appSettingsSlice';
import { loadDebugState as loadDebugStateAction } from '../store/debugSlice';
import { loadThemeMode } from '../helpers/ThemeStorage';
import { loadGameState } from '../helpers/GameStorage';
import { loadFriends } from '../helpers/FriendsStorage';
import { loadGameTypes } from '../helpers/GameTypesStorage';
import { loadGameHistory } from '../helpers/GameHistoryStorage';
import { runBuiltinTimesMigrationOnce } from '../helpers/BuiltinTimesMigration';
import { loadAppSettings } from '../helpers/AppSettingsStorage';
import { loadDebugState } from '../helpers/DebugStorage';
import { installGlobalDebugErrorHandler } from '../helpers/DebugLogger';
import type { RootState } from '../store/store';
import { getAppIconInsideExpoLocalSaved } from '../config';
import { ComponentIds } from '../constants/ComponentIds';
import ExpoUpdateLoader from '../components/ExpoUpdateLoader';
import { useExpoUpdateForegroundCheck } from '../hooks/useExpoUpdateForegroundCheck';

const PRIMARY_COLOR = '#2563eb';

// ─── Theme sync bridge ────────────────────────────────────────────────────────

function ThemeSyncBridge() {
	const selectedMode = useSelector((state: RootState) => state.theme.selectedMode);
	const { setThemeMode } = useTheme();

	useEffect(() => {
		setThemeMode(selectedMode);
	}, [selectedMode, setThemeMode]);

	return null;
}

// Returns a `drawerIcon` render-prop for the given icon set/name, so each
// Drawer.Screen's options can reference a stable function instead of
// defining a new arrow (and thus a new "component") on every render.
function makeDrawerIcon(IconSet: typeof Ionicons, name: string) {
	return ({ color, size }: { color: string; size: number }) => <IconSet name={name as any} size={size} color={color} />;
}

const renderDrawerContent = (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />;

// ─── Drawer navigator ─────────────────────────────────────────────────────────

function ThemedDrawerNavigator() {
	const { theme } = useTheme();

	return (
		<>
			<StatusBar style="auto" />
			<Drawer
				drawerContent={renderDrawerContent}
				backBehavior="history"
				screenOptions={{
					drawerActiveTintColor: PRIMARY_COLOR,
					headerStyle: { backgroundColor: theme.header.background },
					headerTintColor: theme.header.text,
					// Overlay the drawer over the content (like the rocket-meals app)
					// instead of pushing/sliding the whole screen aside.
					drawerType: 'front',
				}}
			>
				<Drawer.Screen
					name="index"
					options={{
						title: 'Aktuelle Partie',
						drawerIcon: makeDrawerIcon(Ionicons, 'game-controller-outline'),
					}}
				/>
				<Drawer.Screen
					name="games/index"
					options={{
						title: 'Spiele',
						drawerIcon: makeDrawerIcon(Ionicons, 'dice-outline'),
					}}
				/>
				<Drawer.Screen
					name="games/[id]"
					options={{
						title: 'Spiel',
						drawerItemStyle: { display: 'none' },
					}}
				/>
				<Drawer.Screen
					name="players/index"
					options={{
						title: 'Freunde',
						drawerIcon: makeDrawerIcon(Ionicons, 'people-outline'),
					}}
				/>
				<Drawer.Screen
					name="timer/index"
					options={{
						title: 'Timer',
						drawerIcon: makeDrawerIcon(Ionicons, 'stopwatch-outline'),
					}}
				/>
				<Drawer.Screen
					name="dice/index"
					options={{
						title: 'Würfel',
						drawerIcon: makeDrawerIcon(Ionicons, 'dice-outline'),
					}}
				/>
				<Drawer.Screen
					name="settings/index"
					options={{
						title: 'Settings',
						drawerIcon: makeDrawerIcon(Ionicons, 'settings-outline'),
					}}
				/>
			</Drawer>
		</>
	);
}

// ─── Drawer content ───────────────────────────────────────────────────────────

function CustomDrawerContent(props: DrawerContentComponentProps) {
	const activeKey = props.state.routes[props.state.index].name;

	const items: DrawerItem[] = [
		{
			key: 'index',
			label: 'Aktuelle Partie',
			nativeID: ComponentIds.DRAWER_ITEM_GAME,
			renderIcon: (_, color) => <Ionicons name="game-controller-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('index'),
		},
		{
			key: 'games/index',
			label: 'Spiele',
			nativeID: ComponentIds.DRAWER_ITEM_GAMES,
			renderIcon: (_, color) => <Ionicons name="dice-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('games/index'),
		},
		{
			key: 'players/index',
			label: 'Freunde',
			nativeID: ComponentIds.DRAWER_ITEM_PLAYERS,
			renderIcon: (_, color) => <Ionicons name="people-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('players/index'),
		},
		{
			key: 'timer/index',
			label: 'Timer',
			nativeID: ComponentIds.DRAWER_ITEM_TIMER,
			renderIcon: (_, color) => <Ionicons name="stopwatch-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('timer/index'),
		},
		{
			key: 'dice/index',
			label: 'Würfel',
			nativeID: ComponentIds.DRAWER_ITEM_DICE,
			renderIcon: (_, color) => <MaterialCommunityIcons name="dice-multiple-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('dice/index'),
		},
		{
			key: 'settings/index',
			label: 'Settings',
			nativeID: ComponentIds.DRAWER_ITEM_SETTINGS,
			renderIcon: (_, color) => <Ionicons name="settings-outline" size={24} color={color} />,
			onPress: () => props.navigation.navigate('settings/index'),
		},
	];

	return (
		<AppDrawer
			logoSource={getAppIconInsideExpoLocalSaved()}
			title="Score Tracker"
			items={items}
			activeKey={activeKey}
			primaryColor={PRIMARY_COLOR}
			onLogoPress={() => props.navigation.navigate('index')}
		/>
	);
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function Layout() {
	useExpoUpdateForegroundCheck();

	useEffect(() => {
		installGlobalDebugErrorHandler();
		loadDebugState()
			.then((state) => {
				store.dispatch(loadDebugStateAction(state));
			})
			.catch((err) => {
				console.warn('[Layout] Failed to load persisted debug state:', err);
			});
		loadThemeMode()
			.then((mode) => {
				store.dispatch(loadThemeModeAction(mode));
			})
			.catch((err) => {
				console.warn('[Layout] Failed to load persisted theme mode:', err);
			});
		loadFriends()
			.then((friends) => {
				store.dispatch(loadFriendsAction(friends));
			})
			.catch((err) => {
				console.warn('[Layout] Failed to load persisted friends:', err);
			});
		// Game state, game types and history load together: the one-time
		// migration of legacy time categories into the built-in match times (see
		// BuiltinTimesMigration) needs all three before any is dispatched - the
		// currently loaded match migrates along with the archived ones.
		Promise.all([loadGameState(), loadGameTypes(), loadGameHistory()])
			.then(async ([gameState, gameTypes, entries]) => {
				const migrated = await runBuiltinTimesMigrationOnce(gameTypes, entries, gameState);
				store.dispatch(loadGameStateAction(migrated.gameState));
				store.dispatch(loadGameTypesAction(migrated.gameTypes));
				store.dispatch(loadGameHistoryAction(migrated.entries));
			})
			.catch((err) => {
				console.warn('[Layout] Failed to load persisted game state/types/history:', err);
			});
		loadAppSettings()
			.then((settings) => {
				store.dispatch(loadAppSettingsAction(settings));
			})
			.catch((err) => {
				console.warn('[Layout] Failed to load persisted app settings:', err);
			});
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ExpoUpdateLoader>
				<Provider store={store}>
					<SafeAreaProvider>
						<ThemeProvider>
							<ThemeSyncBridge />
							<SettingsProvider primaryColor={PRIMARY_COLOR}>
								{/* ToastProvider wraps ModalProvider so toasts (e.g. clipboard
								    feedback) render above open bottom-sheet modals. */}
								<ToastProvider>
									<ModalProvider>
										<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
											<ThemedDrawerNavigator />
										</KeyboardAvoidingView>
									</ModalProvider>
								</ToastProvider>
							</SettingsProvider>
						</ThemeProvider>
					</SafeAreaProvider>
				</Provider>
			</ExpoUpdateLoader>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	keyboardAvoidingView: {
		flex: 1,
	},
});
