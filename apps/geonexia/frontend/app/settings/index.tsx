import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, MaterialIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListBoolean,
	SettingsListGroupTitle,
	SettingsListSelectOption,
	SettingsListMyMapThemeSelection,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';

import { deleteAllActivities } from '../../helpers/ActivityStorage';
import { loadPersistedState, setDebugMode, setDevMode, loadWalkedEdgesState } from '../../store/hexTileSlice';
import { setThemeMode } from '../../store/themeSlice';
import type { ThemeMode } from '../../store/themeSlice';
import { setGpsIntervalMode } from '../../store/gpsIntervalSlice';
import type { GpsIntervalMode } from '../../store/gpsIntervalSlice';
import { setTTSEnabled } from '../../store/ttsSlice';
import SpeechSettingsContent from '../../components/SpeechSettingsModal';
import { AppDispatch, RootState, store } from '../../store/store';
import { updateDisplaySettings } from '../../store/displaySettingsSlice';
import {
	saveDebugModeFlag,
	saveDevModeFlag,
	saveHexTileState,
	saveDevHexTileState,
	loadHexTileState,
	loadDevHexTileState,
	saveWalkedEdges,
	saveDevWalkedEdges,
	loadWalkedEdges,
	loadDevWalkedEdges,
} from '../../helpers/HexTileStorage';
import { getCompanyLogoLocalSaved } from '../../config';
import { loadTTSLog, clearTTSLog, type TTSLogEntry } from '../../helpers/TTSLogStorage';

const PRIMARY_COLOR = '#2563eb';
const NOTIFICATION_COLOR = '#16a34a';
const NEUTRAL_COLOR = '#6b7280';
const DANGER_COLOR = '#dc2626';
const GPS_COLOR = '#7c3aed';
const TTS_COLOR = '#0369a1';
const DEBUG_COLOR = '#0f766e';
const DEV_COLOR = '#f59e0b';
const MAP_COLOR = '#0891b2';

const OPACITY_STEP = 0.05;
const OPACITY_MIN = 0.05;
const OPACITY_MAX = 1.0;

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
	{ id: 'light', label: 'Light', icon: <MaterialCommunityIcons name="white-balance-sunny" size={22} color="#ffffff" /> },
	{ id: 'dark', label: 'Dark', icon: <MaterialCommunityIcons name="moon-waning-crescent" size={22} color="#ffffff" /> },
	{ id: 'systematic', label: 'System', icon: <MaterialCommunityIcons name="theme-light-dark" size={22} color="#ffffff" /> },
];

const GPS_INTERVAL_OPTIONS: { id: GpsIntervalMode; label: string; icon: React.ReactNode }[] = [
	{ id: 'default', label: 'Standard (1s)', icon: <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#ffffff" /> },
	{ id: 'energy_saving', label: 'Energie sparen (4s)', icon: <MaterialCommunityIcons name="battery-heart-outline" size={22} color="#ffffff" /> },
	{ id: 'high_precision', label: 'Hohe Präzision (0.5s)', icon: <MaterialCommunityIcons name="radar" size={22} color="#ffffff" /> },
];

function gpsIntervalModeLabel(mode: GpsIntervalMode): string {
	switch (mode) {
		case 'default': return 'Standard (1s)';
		case 'energy_saving': return 'Energie sparen (4s)';
		case 'high_precision': return 'Hohe Präzision (0.5s)';
	}
}

function themeModeLabel(mode: ThemeMode): string {
	switch (mode) {
		case 'light': return 'Light';
		case 'dark': return 'Dark';
		case 'systematic': return 'System';
	}
}

// ─── Reset Confirm Content ────────────────────────────────────────────────────

function ResetConfirmContent({
	onConfirm,
	onCancel,
	theme,
}: {
	onConfirm: () => void;
	onCancel: () => void;
	theme: ReturnType<typeof useTheme>['theme'];
}) {
	return (
		<View style={styles.resetConfirmContainer}>
			<Text style={[styles.resetConfirmText, { color: theme.screen.text }]}>
				All activities and hex tile progress will be permanently deleted. This action cannot be undone.
			</Text>
			<TouchableOpacity
				style={[styles.resetConfirmButton, { backgroundColor: DANGER_COLOR }]}
				onPress={onConfirm}
				activeOpacity={0.8}
			>
				<MaterialIcons name="delete-forever" size={18} color="#ffffff" />
				<Text style={styles.resetConfirmButtonText}>Reset All Data</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.resetCancelButton} onPress={onCancel} activeOpacity={0.8}>
				<Text style={[styles.resetCancelButtonText, { color: theme.screen.text }]}>Cancel</Text>
			</TouchableOpacity>
		</View>
	);
}

// ─── TTS Log Content ──────────────────────────────────────────────────────────

function TTSLogContent({
	theme,
	onClear,
}: {
	theme: ReturnType<typeof useTheme>['theme'];
	onClear: () => void;
}) {
	const [entries, setEntries] = useState<TTSLogEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadTTSLog().then((log) => {
			setEntries(log.slice().reverse()); // newest first
			setLoading(false);
		});
	}, []);

	const handleClear = useCallback(() => {
		clearTTSLog();
		setEntries([]);
		onClear();
	}, [onClear]);

	if (loading) {
		return <Text style={{ color: theme.screen.text, padding: 16 }}>Loading…</Text>;
	}

	return (
		<View style={styles.ttsLogContainer}>
			<TouchableOpacity
				style={[styles.resetConfirmButton, { backgroundColor: DANGER_COLOR }]}
				onPress={handleClear}
				activeOpacity={0.8}
			>
				<MaterialIcons name="delete-sweep" size={18} color="#ffffff" />
				<Text style={styles.resetConfirmButtonText}>Clear Log ({entries.length})</Text>
			</TouchableOpacity>

			{entries.length === 0 ? (
				<Text style={[styles.ttsLogEmpty, { color: theme.screen.text }]}>
					No TTS log entries yet.
				</Text>
			) : (
				entries.map((entry, idx) => {
					const date = new Date(entry.timestamp);
					const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
					return (
						<View
							key={`${entry.timestamp}-${idx}`}
							style={[
								styles.ttsLogEntry,
								{ borderColor: entry.success ? '#16a34a40' : '#dc262640' },
							]}
						>
							<View style={styles.ttsLogHeader}>
								<Text style={[styles.ttsLogSource, { color: entry.success ? '#16a34a' : DANGER_COLOR }]}>
									{entry.success ? '✓' : '✗'} {entry.source}
								</Text>
								<Text style={[styles.ttsLogTime, { color: theme.screen.text }]}>{timeStr}</Text>
							</View>
							<Text style={[styles.ttsLogText, { color: theme.screen.text }]} numberOfLines={3}>
								{entry.text}
							</Text>
							{entry.error ? (
								<Text style={[styles.ttsLogError, { color: DANGER_COLOR }]} numberOfLines={2}>
									Error: {entry.error}
								</Text>
							) : null}
						</View>
					);
				})
			)}
		</View>
	);
}

// ─── Settings Screen ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
	const [notifications, setNotifications] = useState(true);
	const [showDeveloper, setShowDeveloper] = useState(false);
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const selectedTheme = useSelector((state: RootState) => state.theme.selectedMode);
	const selectedGpsInterval = useSelector((state: RootState) => state.gpsInterval.selectedMode);
	const isTTSEnabled = useSelector((state: RootState) => state.tts.ttsEnabled);
	const speechEnabled = useSelector((state: RootState) => state.speechSettings.enabled);
	const isDebugMode = useSelector((state: RootState) => state.hexTiles.isDebugMode);
	const isDevMode = useSelector((state: RootState) => state.hexTiles.isDevMode);
	const hexTileOpacity = useSelector((state: RootState) => state.displaySettings.hexTileOpacity);
	const objectOpacity = useSelector((state: RootState) => state.displaySettings.objectOpacity);
	const selectedMapTheme = useSelector((state: RootState) => state.displaySettings.mapTheme);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const { show: showResetModal, close: closeResetModal } = useMyScrollViewModal();
	const { show: showGpsModal, close: closeGpsModal } = useMyScrollViewModal();
	const { show: showSpeechModal } = useMyScrollViewModal();
	const { show: showTTSLogModal, close: closeTTSLogModal } = useMyScrollViewModal();

	const appVersion = Constants.expoConfig?.version ?? '1.0.0';

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

	const handleOpenGpsIntervalSelection = useCallback(() => {
		showGpsModal({
			title: '📡 GPS Frequency',
			children: (
				<SettingsListSelectOption
					options={GPS_INTERVAL_OPTIONS}
					selectedOption={selectedGpsInterval}
					onSelect={(option) => {
						dispatch(setGpsIntervalMode(option.id));
						closeGpsModal();
					}}
					iconBgColor={PRIMARY_COLOR}
				/>
			),
		});
	}, [showGpsModal, closeGpsModal, dispatch, selectedGpsInterval]);

	const handleResetAllData = useCallback(() => {
		showResetModal({
			title: '⚠️ Reset All Data',
			children: (
				<ResetConfirmContent
					onConfirm={() => {
						deleteAllActivities();
						dispatch(loadPersistedState({}));
						dispatch(loadWalkedEdgesState([]));
						saveWalkedEdges([]);
						closeResetModal();
					}}
					onCancel={closeResetModal}
					theme={theme}
				/>
			),
		});
	}, [showResetModal, closeResetModal, dispatch, theme]);

	const handleToggleDebugMode = useCallback(() => {
		const next = !isDebugMode;
		dispatch(setDebugMode(next));
		saveDebugModeFlag(next);
	}, [dispatch, isDebugMode]);

	const handleToggleTTS = useCallback(() => {
		dispatch(setTTSEnabled(!isTTSEnabled));
	}, [dispatch, isTTSEnabled]);

	const handleOpenSpeechSettings = useCallback(() => {
		showSpeechModal({
			title: '🔊 Sprachansagen',
			children: <SpeechSettingsContent />,
		});
	}, [showSpeechModal]);

	const handleOpenTTSLog = useCallback(() => {
		showTTSLogModal({
			title: '📋 TTS Log',
			children: <TTSLogContent theme={theme} onClear={closeTTSLogModal} />,
		});
	}, [showTTSLogModal, closeTTSLogModal, theme]);

	const handleToggleDevMode = useCallback(async () => {
		const { records: currentRecords, isDevMode: currentIsDevMode, walkedEdges: currentEdges } = store.getState().hexTiles;
		if (currentIsDevMode) {
			saveDevHexTileState(currentRecords);
			saveDevWalkedEdges(currentEdges);
			const [prodRecords, prodEdges] = await Promise.all([loadHexTileState(), loadWalkedEdges()]);
			saveDevModeFlag(false);
			dispatch(setDevMode({ isDevMode: false, records: prodRecords, walkedEdges: prodEdges }));
		} else {
			saveHexTileState(currentRecords);
			saveWalkedEdges(currentEdges);
			const [devRecords, devEdges] = await Promise.all([loadDevHexTileState(), loadDevWalkedEdges()]);
			saveDevModeFlag(true);
			dispatch(setDevMode({ isDevMode: true, records: devRecords, walkedEdges: devEdges }));
		}
	}, [dispatch]);

	const handleHexTileOpacityDown = useCallback(() => {
		const next = Math.max(OPACITY_MIN, Math.round((hexTileOpacity - OPACITY_STEP) * 100) / 100);
		dispatch(updateDisplaySettings({ hexTileOpacity: next }));
	}, [dispatch, hexTileOpacity]);

	const handleHexTileOpacityUp = useCallback(() => {
		const next = Math.min(OPACITY_MAX, Math.round((hexTileOpacity + OPACITY_STEP) * 100) / 100);
		dispatch(updateDisplaySettings({ hexTileOpacity: next }));
	}, [dispatch, hexTileOpacity]);

	const handleObjectOpacityDown = useCallback(() => {
		const next = Math.max(OPACITY_MIN, Math.round((objectOpacity - OPACITY_STEP) * 100) / 100);
		dispatch(updateDisplaySettings({ objectOpacity: next }));
	}, [dispatch, objectOpacity]);

	const handleObjectOpacityUp = useCallback(() => {
		const next = Math.min(OPACITY_MAX, Math.round((objectOpacity + OPACITY_STEP) * 100) / 100);
		dispatch(updateDisplaySettings({ objectOpacity: next }));
	}, [dispatch, objectOpacity]);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<SettingsListGroupTitle title="Appearance" />
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

			<SettingsListGroupTitle title="GPS" />
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialCommunityIcons name="crosshairs-gps" size={22} color="#ffffff" />}
				label="GPS Frequency"
				value={gpsIntervalModeLabel(selectedGpsInterval)}
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={handleOpenGpsIntervalSelection}
				groupPosition="single"
			/>

			<SettingsListGroupTitle title="Audio" />
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />}
				label="Sprachansagen"
				value={speechEnabled ? 'Aktiviert' : 'Deaktiviert'}
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={handleOpenSpeechSettings}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={TTS_COLOR}
				leftIcon={<MaterialIcons name="article" size={22} color="#ffffff" />}
				label="TTS Log"
				value="View speech logs"
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={handleOpenTTSLog}
				groupPosition="bottom"
			/>

				<SettingsListGroupTitle title="Notifications" />
				<SettingsListBoolean
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Ionicons name="notifications-outline" size={22} color="#ffffff" />}
					label="Push Notifications"
					isEnabled={notifications}
					onToggle={() => setNotifications((prev) => !prev)}
					valueActive="Enabled"
					valueInactive="Disabled"
					groupPosition="single"
				/>

				<SettingsListGroupTitle title="Karten-Darstellung" />
				<SettingsList
					iconBgColor={MAP_COLOR}
					leftIcon={<MaterialCommunityIcons name="hexagon-outline" size={22} color="#ffffff" />}
					label="Hex-Feld Deckkraft"
					value={`${Math.round(hexTileOpacity * 100)}%`}
					rightElement={
						<View style={styles.stepper}>
							<TouchableOpacity style={styles.stepBtn} onPress={handleHexTileOpacityDown} activeOpacity={0.7}>
								<Ionicons name="remove" size={18} color={MAP_COLOR} />
							</TouchableOpacity>
							<TouchableOpacity style={styles.stepBtn} onPress={handleHexTileOpacityUp} activeOpacity={0.7}>
								<Ionicons name="add" size={18} color={MAP_COLOR} />
							</TouchableOpacity>
						</View>
					}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={MAP_COLOR}
					leftIcon={<MaterialCommunityIcons name="image-outline" size={22} color="#ffffff" />}
					label="Objekte Deckkraft"
					value={`${Math.round(objectOpacity * 100)}%`}
					rightElement={
						<View style={styles.stepper}>
							<TouchableOpacity style={styles.stepBtn} onPress={handleObjectOpacityDown} activeOpacity={0.7}>
								<Ionicons name="remove" size={18} color={MAP_COLOR} />
							</TouchableOpacity>
							<TouchableOpacity style={styles.stepBtn} onPress={handleObjectOpacityUp} activeOpacity={0.7}>
								<Ionicons name="add" size={18} color={MAP_COLOR} />
							</TouchableOpacity>
						</View>
					}
					groupPosition="bottom"
				/>

				<SettingsListGroupTitle title="Karten Theme" />
				<SettingsListMyMapThemeSelection
					selectedMapStyleKey={selectedMapTheme}
					onMapStyleKeyChange={(key) => dispatch(updateDisplaySettings({ mapTheme: key }))}
					accentColor={MAP_COLOR}
					iconBgColor={MAP_COLOR}
					leftIcon={<MaterialCommunityIcons name="map-outline" size={22} color="#ffffff" />}
					label="Karten Material"
					modalTitle="🗺️ Karten Material"
					groupPosition="single"
				/>

				<SettingsListGroupTitle title="Daten Verwaltung" />
				<SettingsList
					iconBgColor={DANGER_COLOR}
					leftIcon={<MaterialIcons name="delete-forever" size={22} color="#ffffff" />}
					label="Alle Daten zurücksetzen"
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleResetAllData}
					groupPosition="single"
				/>

				<SettingsListGroupTitle title="About" />
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Feather name="info" size={22} color="#ffffff" />}
					label="App Version"
					value={appVersion}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Feather name="code" size={22} color="#ffffff" />}
					label="Open Source"
					value="View licenses"
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => {}}
					groupPosition="bottom"
				/>

				{/* ── Company Logo ─────────────────────────────────────── */}
				<TouchableOpacity
					style={styles.companyLogoContainer}
					onPress={() => setShowDeveloper((prev) => !prev)}
					activeOpacity={0.7}
				>
					<Image
						source={getCompanyLogoLocalSaved()}
						style={styles.companyLogo}
						resizeMode="contain"
					/>
				</TouchableOpacity>

				{/* ── Developer (hidden by default, revealed by logo tap) ── */}
				{showDeveloper && (
					<>
						<SettingsListGroupTitle title="Developer" />
						<SettingsListBoolean
							iconBgColor={DEBUG_COLOR}
							leftIcon={<MaterialIcons name="bug-report" size={22} color="#ffffff" />}
							label="Debug Mode"
							isEnabled={isDebugMode}
							onToggle={handleToggleDebugMode}
							valueActive="Enabled"
							valueInactive="Disabled"
							groupPosition="top"
						/>
						<SettingsListBoolean
							iconBgColor={DEV_COLOR}
							leftIcon={<Ionicons name="flask-outline" size={22} color="#ffffff" />}
							label="Dev Mode"
							isEnabled={isDevMode}
							onToggle={handleToggleDevMode}
							valueActive="Dev tiles active"
							valueInactive="Production tiles"
							groupPosition="bottom"
						/>
					</>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f3f4f6',
	},
	listContent: {
		paddingVertical: 16,
	},
	resetConfirmContainer: {
		paddingTop: 8,
		gap: 4,
	},
	resetConfirmText: {
		fontSize: 15,
		lineHeight: 22,
		marginBottom: 8,
	},
	resetConfirmButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 10,
		gap: 8,
	},
	resetConfirmButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	resetCancelButton: {
		alignItems: 'center',
		paddingVertical: 12,
		borderRadius: 10,
	},
	resetCancelButtonText: {
		fontSize: 15,
		fontWeight: '500',
	},
	companyLogoContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 24,
		marginTop: 8,
	},
	companyLogo: {
		width: 120,
		height: 120,
		opacity: 0.6,
	},
	stepper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	stepBtn: {
		padding: 6,
	},
	ttsLogContainer: {
		paddingTop: 8,
		gap: 8,
	},
	ttsLogEmpty: {
		fontSize: 14,
		textAlign: 'center',
		paddingVertical: 24,
		opacity: 0.5,
	},
	ttsLogEntry: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		gap: 4,
	},
	ttsLogHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	ttsLogSource: {
		fontSize: 13,
		fontWeight: '600',
	},
	ttsLogTime: {
		fontSize: 11,
		opacity: 0.6,
	},
	ttsLogText: {
		fontSize: 13,
		lineHeight: 18,
	},
	ttsLogError: {
		fontSize: 12,
		fontStyle: 'italic',
	},
});
