import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListBoolean,
	SettingsListGroupTitle,
	SettingsListNumberInput,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';
import * as Speech from 'expo-speech';
import { getLocales } from 'expo-localization';

import { updateSpeechSettings, SpeechSettingsState } from '../store/speechSettingsSlice';
import { speakAnnouncement } from '../helpers/TTSHelper';
import type { AppDispatch, RootState } from '../store/store';

// ─── Constants ────────────────────────────────────────────────────────────────

const TTS_COLOR = '#0369a1';
const INTERVAL_COLOR = '#7c3aed';
const CONTENT_COLOR = '#16a34a';
const HINT_COLOR = '#d97706';
const VOLUME_COLOR = '#2563eb';
const VOLUME_STEP = 0.1;
const VOLUME_MIN = 0.0;
const VOLUME_MAX = 1.0;

// ─── SpeechSettingsContent ────────────────────────────────────────────────────

export default function SpeechSettingsContent() {
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const settings = useSelector((state: RootState) => state.speechSettings);
	const { show: showNumberModal, close: closeNumberModal } = useMyScrollViewModal();

	const locale = getLocales()[0]?.languageTag ?? 'en-US';
	const langCode = locale.split('-')[0].toLowerCase();

	const update = useCallback(
		(partial: Partial<SpeechSettingsState>) => {
			dispatch(updateSpeechSettings(partial));
		},
		[dispatch],
	);

	// ─── Play sample announcement ─────────────────────────────────────────────
	const handlePlaySample = useCallback(() => {
		const text =
			langCode === 'de'
				? '2 Kilometer. Pace: 5 Minuten und 30 Sekunden.'
				: '2 kilometers. Pace: 5 minutes and 30 seconds.';
		speakAnnouncement(text, langCode, {
			volume: settings.volume,
			useApplicationAudioSession: !settings.playOverMusic,
		});
	}, [langCode, settings.volume, settings.playOverMusic]);

	// ─── Volume stepper ───────────────────────────────────────────────────────
	const handleVolumeDown = useCallback(() => {
		const next = Math.max(VOLUME_MIN, Math.round((settings.volume - VOLUME_STEP) * 10) / 10);
		update({ volume: next });
	}, [settings.volume, update]);

	const handleVolumeUp = useCallback(() => {
		const next = Math.min(VOLUME_MAX, Math.round((settings.volume + VOLUME_STEP) * 10) / 10);
		update({ volume: next });
	}, [settings.volume, update]);

	// ─── Number input openers (nested modals) ─────────────────────────────────
	const openNumberInput = useCallback(
		(opts: {
			title: string;
			field: keyof SpeechSettingsState;
			initial: number;
			min?: number;
			max?: number;
			step?: number;
			suffix?: string;
		}) => {
			showNumberModal({
				title: opts.title,
				children: (
					<SettingsListNumberInput
						modalTitle={opts.title}
						initialValue={opts.initial}
						min={opts.min}
						max={opts.max}
						step={opts.step}
						suffix={opts.suffix}
						placeholder="0"
						onSave={(val) => {
							update({ [opts.field]: val });
							closeNumberModal();
						}}
						groupPosition="single"
					/>
				),
			});
		},
		[showNumberModal, closeNumberModal, update],
	);

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<ScrollView contentContainerStyle={styles.content}>
			{/* ── Master toggle ──────────────────────────────────────── */}
			<SettingsListGroupTitle title="Allgemein" />
			<SettingsListBoolean
				iconBgColor={TTS_COLOR}
				leftIcon={<MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />}
				label="Aktiviert"
				isEnabled={settings.enabled}
				onToggle={() => update({ enabled: !settings.enabled })}
				valueActive="Sprachansagen aktiv"
				valueInactive="Sprachansagen deaktiviert"
				groupPosition="single"
			/>

			{/* ── Play sample ────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Abspielen" />
			<SettingsList
				iconBgColor={TTS_COLOR}
				leftIcon={<MaterialIcons name="play-circle-filled" size={22} color="#ffffff" />}
				label="Kurzen Text abspielen"
				value={
					langCode === 'de'
						? '2 Kilometer. Pace: 5 Min 30 Sek'
						: '2 km. Pace: 5 min 30 sec'
				}
				rightIcon={<MaterialIcons name="play-arrow" size={24} color={TTS_COLOR} />}
				handleFunction={handlePlaySample}
				groupPosition="single"
			/>

			{/* ── Volume ─────────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Lautstärke" />
			<SettingsList
				iconBgColor={VOLUME_COLOR}
				leftIcon={<Ionicons name="volume-medium" size={22} color="#ffffff" />}
				label="Volume"
				value={`${Math.round(settings.volume * 100)}%`}
				rightElement={
					<View style={styles.stepper}>
						<TouchableOpacity style={styles.stepBtn} onPress={handleVolumeDown}>
							<Ionicons name="volume-low" size={18} color={VOLUME_COLOR} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.stepBtn} onPress={handleVolumeUp}>
							<Ionicons name="volume-high" size={18} color={VOLUME_COLOR} />
						</TouchableOpacity>
					</View>
				}
				groupPosition="single"
			/>

			{/* ── Pace hint ──────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Hinweis bei schnellerem Pace" />
			<SettingsListNumberInput
				iconBgColor={HINT_COLOR}
				leftIcon={<MaterialCommunityIcons name="timer-outline" size={22} color="#ffffff" />}
				label="Minuten"
				value={`${settings.paceHintMinutes} min`}
				modalTitle="Pace Hinweis: Minuten"
				initialValue={settings.paceHintMinutes}
				min={0}
				max={30}
				step={1}
				suffix="min"
				onSave={(val) => update({ paceHintMinutes: val })}
				groupPosition="top"
			/>
			<SettingsListNumberInput
				iconBgColor={HINT_COLOR}
				leftIcon={<MaterialCommunityIcons name="clock-fast" size={22} color="#ffffff" />}
				label="Sekunden"
				value={`${settings.paceHintSeconds} sek`}
				modalTitle="Pace Hinweis: Sekunden"
				initialValue={settings.paceHintSeconds}
				min={0}
				max={59}
				step={5}
				suffix="sek"
				onSave={(val) => update({ paceHintSeconds: val })}
				groupPosition="bottom"
			/>

			{/* ── Music ──────────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Musik" />
			<SettingsListBoolean
				iconBgColor={TTS_COLOR}
				leftIcon={<MaterialCommunityIcons name="music" size={22} color="#ffffff" />}
				label="Über Musik abspielen"
				isEnabled={settings.playOverMusic}
				onToggle={() => update({ playOverMusic: !settings.playOverMusic })}
				valueActive="TTS über Musik"
				valueInactive="Musik pausiert bei TTS"
				groupPosition="single"
			/>

			{/* ── Information intervals ──────────────────────────────── */}
			<SettingsListGroupTitle title="Information im Intervall von" />
			<SettingsListNumberInput
				iconBgColor={INTERVAL_COLOR}
				leftIcon={<MaterialCommunityIcons name="clock-outline" size={22} color="#ffffff" />}
				label="Zeit"
				value={settings.intervalTimeMinutes > 0 ? `Alle ${settings.intervalTimeMinutes} min` : 'Deaktiviert'}
				modalTitle="Zeitintervall"
				initialValue={settings.intervalTimeMinutes}
				min={0}
				max={60}
				step={1}
				suffix="min"
				onSave={(val) => update({ intervalTimeMinutes: val })}
				groupPosition="top"
			/>
			<SettingsListNumberInput
				iconBgColor={INTERVAL_COLOR}
				leftIcon={<MaterialCommunityIcons name="map-marker-distance" size={22} color="#ffffff" />}
				label="Distanz"
				value={settings.intervalDistanceMeters > 0 ? `Alle ${settings.intervalDistanceMeters} m` : 'Deaktiviert'}
				modalTitle="Distanzintervall"
				initialValue={settings.intervalDistanceMeters}
				min={0}
				max={10000}
				step={100}
				suffix="m"
				onSave={(val) => update({ intervalDistanceMeters: val })}
				groupPosition="bottom"
			/>

			{/* ── Tone / Vibration at distance ───────────────────────── */}
			<SettingsListGroupTitle title="Benachrichtigung bei Distanz" />
			<SettingsListBoolean
				iconBgColor={INTERVAL_COLOR}
				leftIcon={<Ionicons name="musical-note" size={22} color="#ffffff" />}
				label="Hinweiston bei Distanz"
				isEnabled={settings.toneAtDistance}
				onToggle={() => update({ toneAtDistance: !settings.toneAtDistance })}
				valueActive="Aktiv"
				valueInactive="Deaktiviert"
				groupPosition="top"
			/>
			<SettingsListBoolean
				iconBgColor={INTERVAL_COLOR}
				leftIcon={<MaterialCommunityIcons name="vibrate" size={22} color="#ffffff" />}
				label="Vibration bei Distanz"
				isEnabled={settings.vibrationAtDistance}
				onToggle={() => update({ vibrationAtDistance: !settings.vibrationAtDistance })}
				valueActive="Aktiv"
				valueInactive="Deaktiviert"
				groupPosition="bottom"
			/>

			{/* ── Announcement content toggles ───────────────────────── */}
			<SettingsListGroupTitle title="Sprachansagen Inhalte" />
			<SettingsListBoolean
				iconBgColor={CONTENT_COLOR}
				leftIcon={<MaterialCommunityIcons name="map-marker-distance" size={22} color="#ffffff" />}
				label="Distanz"
				isEnabled={settings.announceDistance}
				onToggle={() => update({ announceDistance: !settings.announceDistance })}
				valueActive="Wird angesagt"
				valueInactive="Deaktiviert"
				groupPosition="top"
			/>
			<SettingsListBoolean
				iconBgColor={CONTENT_COLOR}
				leftIcon={<MaterialCommunityIcons name="timer-outline" size={22} color="#ffffff" />}
				label="Dauer"
				isEnabled={settings.announceDuration}
				onToggle={() => update({ announceDuration: !settings.announceDuration })}
				valueActive="Wird angesagt"
				valueInactive="Deaktiviert"
				groupPosition="middle"
			/>
			<SettingsListBoolean
				iconBgColor={CONTENT_COLOR}
				leftIcon={<MaterialCommunityIcons name="speedometer-medium" size={22} color="#ffffff" />}
				label="Pace"
				isEnabled={settings.announcePace}
				onToggle={() => update({ announcePace: !settings.announcePace })}
				valueActive="Wird angesagt"
				valueInactive="Deaktiviert"
				groupPosition="middle"
			/>
			<SettingsListBoolean
				iconBgColor={CONTENT_COLOR}
				leftIcon={<MaterialCommunityIcons name="speedometer" size={22} color="#ffffff" />}
				label="Geschwindigkeit"
				isEnabled={settings.announceSpeed}
				onToggle={() => update({ announceSpeed: !settings.announceSpeed })}
				valueActive="Wird angesagt"
				valueInactive="Deaktiviert"
				groupPosition="middle"
			/>
			<SettingsListBoolean
				iconBgColor={CONTENT_COLOR}
				leftIcon={<MaterialCommunityIcons name="fire" size={22} color="#ffffff" />}
				label="Kalorien"
				isEnabled={settings.announceCalories}
				onToggle={() => update({ announceCalories: !settings.announceCalories })}
				valueActive="Wird angesagt"
				valueInactive="Deaktiviert"
				groupPosition="middle"
			/>
			<SettingsListBoolean
				iconBgColor={CONTENT_COLOR}
				leftIcon={<MaterialCommunityIcons name="heart-pulse" size={22} color="#ffffff" />}
				label="Herzfrequenz"
				isEnabled={settings.announceHeartRate}
				onToggle={() => update({ announceHeartRate: !settings.announceHeartRate })}
				valueActive="Wird angesagt"
				valueInactive="Deaktiviert"
				groupPosition="bottom"
			/>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	content: {
		paddingBottom: 40,
	},
	stepper: {
		flexDirection: 'row',
		gap: 4,
	},
	stepBtn: {
		width: 36,
		height: 36,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(37,99,235,0.12)',
	},
});
