import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
	LicenseInformation,
	getLicensesFromExtra,
	SettingsList,
	SettingsListBoolean,
	SettingsListGroupTitle,
	SettingsListSelectOption,
	SettingsListSqliteBackup,
	SettingsListSqliteStorage,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';
import { setThemeMode } from '../../store/themeSlice';
import type { ThemeMode } from '../../store/themeSlice';
import { setDebugMode, clearDebugLogs } from '../../store/debugSlice';
import { setOnboardingCompleted } from '../../store/appSettingsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { ComponentIds } from '../../constants/ComponentIds';
import { getCompanyLogoLocalSaved, getCustomerConfig, getVersionInternalForAppsettingsScreen, SUPPORT_EMAIL } from '../../config';

const PRIMARY_COLOR = '#2563eb';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
	{ id: 'light', label: 'Light', icon: <MaterialCommunityIcons name="white-balance-sunny" size={22} color="#ffffff" /> },
	{ id: 'dark', label: 'Dark', icon: <MaterialCommunityIcons name="moon-waning-crescent" size={22} color="#ffffff" /> },
	{ id: 'systematic', label: 'System', icon: <MaterialCommunityIcons name="theme-light-dark" size={22} color="#ffffff" /> },
];

function themeModeLabel(mode: ThemeMode): string {
	switch (mode) {
		case 'light': return 'Light';
		case 'dark': return 'Dark';
		case 'systematic': return 'System';
	}
}

const DEBUG_COLOR = '#7c3aed';
const SUCCESS_COLOR = '#16a34a';

export default function SettingsScreen() {
	const { theme } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const selectedTheme = useSelector((state: RootState) => state.theme.selectedMode);
	const debugMode = useSelector((state: RootState) => state.debug.debugMode);
	const debugLogs = useSelector((state: RootState) => state.debug.logs);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	// Version straight from the JS bundle (config.ts), NOT from
	// Constants.expoConfig: the latter reflects the natively embedded manifest,
	// so OTA updates (which only bump the patch version) would never show up
	// and users could not verify they are running the latest update.
	const appVersion = getVersionInternalForAppsettingsScreen();
	const appName = getCustomerConfig().projectName;
	const licenses = getLicensesFromExtra(Constants.expoConfig?.extra);

	// Revealed for this app session by pressing the footer logo/version (see
	// handleFooterPress below). Not persisted on its own - debugMode itself
	// (toggled once revealed) is what's actually persisted, and reveals this
	// section again on next launch (mirrors rocket-meals-dev's DebugView:
	// `isVisible || debugMode || ...`).
	const [devRevealed, setDevRevealed] = useState(false);

	const handleFooterPress = useCallback(() => {
		setDevRevealed((prev) => !prev);
	}, []);

	const showDebugSection = devRevealed || debugMode;

	const formattedLogs = useMemo(() => {
		return debugLogs
			.slice()
			.reverse()
			.map((entry) => `${new Date(entry.timestamp).toLocaleTimeString('de-DE')} - ${entry.message}`);
	}, [debugLogs]);

	const handleCopyLogs = useCallback(async () => {
		await Clipboard.setStringAsync(formattedLogs.join('\n') || '(keine Logs)');
	}, [formattedLogs]);

	const handleOpenThemeSelection = useCallback(() => {
		showModal({
			title: '🎨 Theme',
			children: (
				<SettingsListSelectOption
					options={THEME_OPTIONS}
					selectedOption={selectedTheme}
					onSelect={(option) => {
						dispatch(setThemeMode(option.id));
						closeModal();
					}}
					iconBgColor={PRIMARY_COLOR}
				/>
			),
		});
	}, [showModal, closeModal, dispatch, selectedTheme]);

	const handleOpenPrivacyPolicy = useCallback(() => {
		router.push('/privacy-policy');
	}, [router]);

	const handleOpenImpressum = useCallback(() => {
		router.push('/impressum');
	}, [router]);

	const handleOpenLicenses = useCallback(() => {
		showModal({
			title: '📦 Open-Source-Lizenzen',
			children: <LicenseInformation packages={licenses} linkColor={PRIMARY_COLOR} />,
		});
	}, [showModal]);

	const handleContactSupport = useCallback(() => {
		const subject = encodeURIComponent(`${appName} App - Feedback (Version ${appVersion})`);
		Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch((err) => {
			console.warn('[Settings] Failed to open mail client:', err);
		});
	}, [appName, appVersion]);

	// Reset the first-launch flag - the gate in app/_layout swaps the whole app
	// for the tour again right away.
	const handleReplayOnboarding = useCallback(() => {
		dispatch(setOnboardingCompleted(false));
	}, [dispatch]);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32, paddingLeft: insets.left, paddingRight: insets.right }]}>
				<SettingsListGroupTitle title="Darstellung" />
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={
						<MaterialCommunityIcons name="theme-light-dark" size={22} color="#ffffff" />
					}
					label="Theme"
					value={themeModeLabel(selectedTheme)}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenThemeSelection}
					groupPosition="single"
				/>

				<SettingsListGroupTitle title="Speicher" />
				<SettingsListSqliteStorage
					iconBgColor="#6b7280"
					iconColor="#ffffff"
					textColor={theme.screen.text}
					texts={{
						total: 'Belegter Speicher',
						refresh: 'Aktualisieren',
						clear: 'Speicher leeren',
						keysModalTitle: 'Gespeicherte Einträge',
						emptyKeys: 'Keine Einträge',
						clearConfirmTitle: 'Speicher leeren',
						clearConfirmMessage: 'Löscht alle lokal gespeicherten Daten (Theme, Spiele, Freunde, ...). Fortfahren?',
						cancel: 'Abbrechen',
						confirmClear: 'Löschen',
					}}
				/>

				<SettingsListGroupTitle title="Datensicherung" />
				<SettingsListSqliteBackup
					appName="score-tracker"
					iconBgColor={PRIMARY_COLOR}
					iconColor="#ffffff"
					textColor={theme.screen.text}
					exportNativeID={ComponentIds.SETTINGS_EXPORT_DATA_ROW}
					importNativeID={ComponentIds.SETTINGS_IMPORT_DATA_ROW}
				/>

				<SettingsListGroupTitle title="Hilfe & Rechtliches" />
				<SettingsList
					nativeID={ComponentIds.SETTINGS_REPLAY_ONBOARDING_ROW}
					iconBgColor={SUCCESS_COLOR}
					leftIcon={<Ionicons name="sparkles-outline" size={22} color="#ffffff" />}
					label="Einführung erneut ansehen"
					value="Die Tour vom ersten Start"
					handleFunction={handleReplayOnboarding}
					groupPosition="top"
				/>
				<SettingsList
					nativeID={ComponentIds.SETTINGS_SUPPORT_ROW}
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Ionicons name="mail-outline" size={22} color="#ffffff" />}
					label="Support kontaktieren"
					value={SUPPORT_EMAIL}
					handleFunction={handleContactSupport}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.SETTINGS_PRIVACY_ROW}
					iconBgColor="#6b7280"
					leftIcon={<Ionicons name="shield-checkmark-outline" size={22} color="#ffffff" />}
					label="Datenschutzerklärung"
					value="Alle Daten bleiben auf deinem Gerät"
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenPrivacyPolicy}
					groupPosition="middle"
				/>
				<SettingsList
					nativeID={ComponentIds.SETTINGS_IMPRESSUM_ROW}
					iconBgColor="#6b7280"
					leftIcon={<Ionicons name="document-text-outline" size={22} color="#ffffff" />}
					label="Impressum"
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenImpressum}
					groupPosition="bottom"
				/>

				<SettingsListGroupTitle title="Über die App" />
				<SettingsList
					nativeID={ComponentIds.SETTINGS_VERSION_ROW}
					iconBgColor="#6b7280"
					leftIcon={<MaterialCommunityIcons name="numeric" size={22} color="#ffffff" />}
					label="Version"
					value={appVersion}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Ionicons name="code-slash-outline" size={22} color="#ffffff" />}
					label="Open-Source-Lizenzen"
					value={`${licenses.length} Pakete`}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenLicenses}
					groupPosition="bottom"
				/>

				{showDebugSection && (
					<>
						<SettingsListGroupTitle title="Debug" />
						<SettingsListBoolean
							nativeID={ComponentIds.SETTINGS_DEBUG_MODE_TOGGLE}
							iconBgColor={DEBUG_COLOR}
							leftIcon={<MaterialCommunityIcons name="bug-outline" size={22} color="#ffffff" />}
							label="Debug-Modus"
							isEnabled={debugMode}
							onToggle={() => dispatch(setDebugMode(!debugMode))}
							groupPosition={debugMode ? 'top' : 'single'}
						/>
						{debugMode && (
							<>
								<SettingsList
									nativeID={ComponentIds.SETTINGS_DEBUG_COPY_LOGS}
									iconBgColor={DEBUG_COLOR}
									leftIcon={<MaterialCommunityIcons name="content-copy" size={22} color="#ffffff" />}
									label="Logs kopieren"
									value={`${debugLogs.length} Einträge`}
									handleFunction={handleCopyLogs}
									groupPosition="middle"
								/>
								<SettingsList
									nativeID={ComponentIds.SETTINGS_DEBUG_CLEAR_LOGS}
									iconBgColor={DEBUG_COLOR}
									leftIcon={<MaterialCommunityIcons name="delete-outline" size={22} color="#ffffff" />}
									label="Logs löschen"
									handleFunction={() => dispatch(clearDebugLogs())}
									groupPosition="bottom"
								/>
								<View style={[styles.logsContainer, { borderColor: theme.screen.text + '22' }]}>
									{formattedLogs.length === 0 ? (
										<Text style={[styles.logsEmptyText, { color: theme.screen.placeholder }]}>
											Noch keine Logs. Der Avatar-Editor und Absturz-Fehler protokollieren hier, solange der Debug-Modus aktiv ist.
										</Text>
									) : (
										formattedLogs.slice(0, 100).map((line, index) => (
											// eslint-disable-next-line react/no-array-index-key
											<Text key={index} style={[styles.logLine, { color: theme.screen.text }]}>
												{line}
											</Text>
										))
									)}
								</View>
							</>
						)}
					</>
				)}

				<TouchableOpacity
					id={ComponentIds.SETTINGS_FOOTER}
					style={styles.footer}
					onPress={handleFooterPress}
				>
					<View style={styles.logoContainer}>
						<Image source={getCompanyLogoLocalSaved()} style={styles.logo} />
					</View>
					<View>
						<Text style={[styles.heading, { color: theme.screen.text }]}>{appName}</Text>
						<Text style={[styles.versionText, { color: theme.screen.placeholder }]}>Version {appVersion}</Text>
					</View>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
	},
	logsContainer: {
		marginTop: 8,
		padding: 12,
		borderWidth: 1,
		borderRadius: 8,
		gap: 4,
	},
	logsEmptyText: {
		fontSize: 13,
	},
	logLine: {
		fontFamily: 'monospace',
		fontSize: 11,
	},
	// Footer: app logo + name/version, pressing it reveals the hidden Debug
	// section - same pattern as rocket-meals-dev's Settings screen footer.
	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
		paddingHorizontal: 4,
	},
	logoContainer: {
		width: 56,
		height: 56,
		borderRadius: 8,
		backgroundColor: '#424242',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 15,
	},
	logo: {
		width: 48,
		height: 48,
		resizeMode: 'contain',
	},
	heading: {
		fontSize: 20,
		fontWeight: '700',
	},
	versionText: {
		fontSize: 13,
		marginTop: 2,
	},
});
