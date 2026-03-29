import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import * as Speech from 'expo-speech';
import { getLocales } from 'expo-localization';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListBoolean,
	SettingsListGroupTitle,
	SettingsListSelectOption,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';

import { buildKmAnnouncement, speakAnnouncement } from '../../../helpers/TTSHelper';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_COLOR = '#2563eb';
const STOP_COLOR = '#e53935';
const AUDIO_COLOR = '#0369a1';
const VOICE_COLOR = '#7c3aed';
const KM_COLOR = '#16a34a';

const RATE_MIN = 0.1;
const RATE_MAX = 2.0;
const RATE_STEP = 0.1;
const RATE_DEFAULT = 1.0;
const PITCH_MIN = 0.5;
const PITCH_MAX = 2.0;
const PITCH_STEP = 0.1;
const PITCH_DEFAULT = 1.0;
const PRECISION = 10; // 1 decimal place

const KM_EXAMPLES: { km: number; pace: number | null }[] = [
	{ km: 1, pace: 6.5 },
	{ km: 5, pace: 5.25 },
	{ km: 10, pace: 4.75 },
	{ km: 21, pace: null },
];

const QUALITY_OPTIONS: { id: Speech.VoiceQuality; label: string; icon: React.ReactNode }[] = [
	{
		id: Speech.VoiceQuality.Default,
		label: 'Default',
		icon: <MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />,
	},
	{
		id: Speech.VoiceQuality.Enhanced,
		label: 'Enhanced',
		icon: <MaterialCommunityIcons name="microphone-plus" size={22} color="#ffffff" />,
	},
];

// ─── Stepper helper ───────────────────────────────────────────────────────────

function clampStep(value: number, delta: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, Math.round((value + delta) * PRECISION) / PRECISION));
}

// ─── TTS Test Screen ──────────────────────────────────────────────────────────

export default function TTSTestScreen() {
	const { theme } = useTheme();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const locale = getLocales()[0]?.languageTag ?? 'en-US';
	const langCode = locale.split('-')[0].toLowerCase();

	// ─── Speech options state ─────────────────────────────────────────────────
	const [useAppAudioSession, setUseAppAudioSession] = useState(true);
	const [rate, setRate] = useState(RATE_DEFAULT);
	const [pitch, setPitch] = useState(PITCH_DEFAULT);
	const [voiceQuality, setVoiceQuality] = useState<Speech.VoiceQuality>(Speech.VoiceQuality.Default);
	const [selectedVoice, setSelectedVoice] = useState<Speech.Voice | null>(null);
	const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
	const [voicesAvailable, setVoicesAvailable] = useState<boolean | null>(null);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [customText, setCustomText] = useState('');

	// ─── Load available voices ────────────────────────────────────────────────
	useEffect(() => {
		if (typeof Speech.getAvailableVoicesAsync !== 'function') {
			setVoicesAvailable(false);
			return;
		}
		setVoicesAvailable(true);
		Speech.getAvailableVoicesAsync()
			.then((voices) => setAvailableVoices(voices))
			.catch(() => {
				setAvailableVoices([]);
				setVoicesAvailable(false);
			});
	}, []);

	// ─── Build current speech options ────────────────────────────────────────
	const buildOptions = useCallback((): Omit<Speech.SpeechOptions, 'language'> => {
		const opts: Omit<Speech.SpeechOptions, 'language'> = {
			useApplicationAudioSession: useAppAudioSession,
			rate,
			pitch,
			onStart: () => setIsSpeaking(true),
			onDone: () => setIsSpeaking(false),
			onStopped: () => setIsSpeaking(false),
			onError: () => setIsSpeaking(false),
		};
		if (selectedVoice?.identifier) {
			opts.voice = selectedVoice.identifier;
		}
		return opts;
	}, [useAppAudioSession, rate, pitch, selectedVoice]);

	// ─── Speak helpers ────────────────────────────────────────────────────────
	const handlePlayCustom = useCallback(() => {
		const text = customText.trim();
		if (!text) return;
		speakAnnouncement(text, langCode, buildOptions());
	}, [customText, langCode, buildOptions]);

	const handlePlayExample = useCallback(
		(km: number, pace: number | null) => {
			const text = buildKmAnnouncement(km, pace, locale);
			speakAnnouncement(text, langCode, buildOptions());
		},
		[locale, langCode, buildOptions],
	);

	const handleStop = useCallback(() => {
		Speech.stop();
		setIsSpeaking(false);
	}, []);

	// ─── Voice quality selection ──────────────────────────────────────────────
	const handleOpenQualitySelection = useCallback(() => {
		showModal({
			title: '🎤 Voice Quality',
			children: (
				<SettingsListSelectOption
					options={QUALITY_OPTIONS}
					selectedOption={voiceQuality}
					onSelect={(option) => {
						setVoiceQuality(option.id);
						closeModal();
					}}
					iconBgColor={VOICE_COLOR}
				/>
			),
		});
	}, [showModal, closeModal, voiceQuality]);

	// ─── Voice selection ──────────────────────────────────────────────────────
	// Show ALL available voices (unfiltered) so users can see every voice with
	// its name and identifier. The voiceQuality setting only affects playback.
	const voiceOptions = availableVoices.map((v) => ({
		id: v.identifier,
		label: `${v.name} (${v.identifier})`,
		icon: <MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />,
	}));
	const noneVoiceOption = {
		id: '__none__',
		label: 'System Default',
		icon: <MaterialCommunityIcons name="auto-fix" size={22} color="#ffffff" />,
	};
	const allVoiceOptions = useMemo(
		() => [noneVoiceOption, ...voiceOptions],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[availableVoices],
	);

	const handleOpenVoiceSelection = useCallback(() => {
		showModal({
			title: '🗣 Select Voice',
			children: (
				<SettingsListSelectOption
					options={allVoiceOptions}
					selectedOption={selectedVoice?.identifier ?? '__none__'}
					onSelect={(option) => {
						if (option.id === '__none__') {
							setSelectedVoice(null);
						} else {
							const found = availableVoices.find((v) => v.identifier === option.id) ?? null;
							setSelectedVoice(found);
						}
						closeModal();
					}}
					iconBgColor={VOICE_COLOR}
				/>
			),
		});
	}, [showModal, closeModal, allVoiceOptions, availableVoices, selectedVoice]);

	// ─── Render ───────────────────────────────────────────────────────────────

	const qualityLabel = voiceQuality === Speech.VoiceQuality.Enhanced ? 'Enhanced' : 'Default';
	const voiceLabel = selectedVoice
		? `${selectedVoice.name} (${selectedVoice.identifier})`
		: 'System Default';
	const rateLabel = rate.toFixed(1) + '×';
	const pitchLabel = pitch.toFixed(1);

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			{/* ── Audio Session ─────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Audio Session" />
			<SettingsListBoolean
				iconBgColor={AUDIO_COLOR}
				leftIcon={<MaterialCommunityIcons name="music-note-bluetooth" size={22} color="#ffffff" />}
				label={Platform.OS === 'ios' ? 'Play over Music' : 'Play over Music (iOS only)'}
				isEnabled={useAppAudioSession}
				onToggle={() => setUseAppAudioSession((v) => !v)}
				valueActive="Enabled"
				valueInactive="Disabled"
				groupPosition="single"
			/>

			{/* ── Voice Options ─────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Voice Options" />
			<SettingsList
				iconBgColor={VOICE_COLOR}
				leftIcon={<MaterialIcons name="speed" size={22} color="#ffffff" />}
				label="Rate"
				value={rateLabel}
				rightElement={
					<View style={styles.stepper}>
						<TouchableOpacity
							style={styles.stepBtn}
							onPress={() => setRate((v) => clampStep(v, -RATE_STEP, RATE_MIN, RATE_MAX))}
						>
							<Ionicons name="remove" size={18} color={VOICE_COLOR} />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.stepBtn}
							onPress={() => setRate((v) => clampStep(v, RATE_STEP, RATE_MIN, RATE_MAX))}
						>
							<Ionicons name="add" size={18} color={VOICE_COLOR} />
						</TouchableOpacity>
					</View>
				}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={VOICE_COLOR}
				leftIcon={<MaterialCommunityIcons name="tune-vertical" size={22} color="#ffffff" />}
				label="Pitch"
				value={pitchLabel}
				rightElement={
					<View style={styles.stepper}>
						<TouchableOpacity
							style={styles.stepBtn}
							onPress={() => setPitch((v) => clampStep(v, -PITCH_STEP, PITCH_MIN, PITCH_MAX))}
						>
							<Ionicons name="remove" size={18} color={VOICE_COLOR} />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.stepBtn}
							onPress={() => setPitch((v) => clampStep(v, PITCH_STEP, PITCH_MIN, PITCH_MAX))}
						>
							<Ionicons name="add" size={18} color={VOICE_COLOR} />
						</TouchableOpacity>
					</View>
				}
				groupPosition="middle"
			/>
			<SettingsList
				iconBgColor={VOICE_COLOR}
				leftIcon={<MaterialCommunityIcons name="star-outline" size={22} color="#ffffff" />}
				label="Voice Quality"
				value={qualityLabel}
				rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
				handleFunction={handleOpenQualitySelection}
				groupPosition={voicesAvailable ? 'middle' : 'bottom'}
			/>
			{voicesAvailable === true && (
				<SettingsList
					iconBgColor={VOICE_COLOR}
					leftIcon={<MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />}
					label="Voice"
					value={voiceLabel}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={handleOpenVoiceSelection}
					groupPosition="bottom"
				/>
			)}
			{voicesAvailable === false && (
				<SettingsList
					iconBgColor={VOICE_COLOR}
					leftIcon={<MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />}
					label="Voice Selection"
					value="Not available on this platform"
					groupPosition="bottom"
				/>
			)}

			{/* ── KM Announcements ──────────────────────────────────────── */}
			<SettingsListGroupTitle title={`KM Announcements (${locale})`} />
			{KM_EXAMPLES.map(({ km, pace }, index) => {
				const text = buildKmAnnouncement(km, pace, locale);
				const isFirst = index === 0;
				const isLast = index === KM_EXAMPLES.length - 1;
				const groupPosition = isFirst && isLast ? 'single' : isFirst ? 'top' : isLast ? 'bottom' : 'middle';
				return (
					<SettingsList
						key={km}
						iconBgColor={KM_COLOR}
						leftIcon={<MaterialCommunityIcons name="run" size={22} color="#ffffff" />}
						label={`${km} km`}
						value={text}
						rightIcon={<MaterialIcons name="play-circle-filled" size={32} color={KM_COLOR} />}
						handleFunction={() => handlePlayExample(km, pace)}
						groupPosition={groupPosition}
					/>
				);
			})}

			{/* ── Custom Text ────────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Custom Text" />
			<View style={[styles.card, { backgroundColor: theme.screen.iconBg }]}>
				<TextInput
					style={[styles.textInput, { color: theme.screen.text, borderColor: theme.screen.background }]}
					placeholder="Type something to speak…"
					placeholderTextColor={theme.screen.placeholder}
					value={customText}
					onChangeText={setCustomText}
					multiline
					returnKeyType="done"
				/>
				<View style={styles.customButtonRow}>
					<TouchableOpacity
						style={[styles.playButton, { backgroundColor: PRIMARY_COLOR, opacity: customText.trim() ? 1 : 0.4 }]}
						onPress={handlePlayCustom}
						disabled={!customText.trim()}
						activeOpacity={0.8}
					>
						<MaterialIcons name="play-arrow" size={20} color="#ffffff" />
						<Text style={styles.buttonText}>Speak</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.stopButton, { backgroundColor: STOP_COLOR, opacity: isSpeaking ? 1 : 0.6 }]}
						onPress={handleStop}
						activeOpacity={0.8}
					>
						<MaterialIcons name="stop" size={20} color="#ffffff" />
						<Text style={styles.buttonText}>Stop</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* ── Device Info ────────────────────────────────────────────── */}
			<SettingsListGroupTitle title="Device Info" />
			<SettingsList
				iconBgColor="#6b7280"
				leftIcon={<MaterialCommunityIcons name="translate" size={22} color="#ffffff" />}
				label="Locale"
				value={locale}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor="#6b7280"
				leftIcon={<MaterialCommunityIcons name="message-text-outline" size={22} color="#ffffff" />}
				label="Language Code"
				value={langCode}
				groupPosition="middle"
			/>
			<SettingsList
				iconBgColor="#6b7280"
				leftIcon={<MaterialCommunityIcons name="microphone" size={22} color="#ffffff" />}
				label="Available Voices"
				value={
					voicesAvailable === null
						? 'Loading…'
						: voicesAvailable === false
						? 'Not supported'
						: `${availableVoices.length} voice${availableVoices.length !== 1 ? 's' : ''}`
				}
				groupPosition="bottom"
			/>

			{/* ── All Voices List ─────────────────────────────────────────────────────────── */}
			{voicesAvailable === true && availableVoices.length > 0 && (
				<>
					<SettingsListGroupTitle title="All Voices: Name (Identifier)" />
					{availableVoices.map((v, index) => {
						const isFirst = index === 0;
						const isLast = index === availableVoices.length - 1;
						const groupPosition =
							isFirst && isLast ? 'single' : isFirst ? 'top' : isLast ? 'bottom' : 'middle';
						return (
							<SettingsList
								key={v.identifier}
								iconBgColor={VOICE_COLOR}
								leftIcon={<MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />}
								label={v.name}
								value={v.identifier}
								groupPosition={groupPosition}
							/>
						);
					})}
				</>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingVertical: 16,
		paddingBottom: 40,
	},
	card: {
		marginHorizontal: 16,
		borderRadius: 12,
		overflow: 'hidden',
	},
	textInput: {
		margin: 12,
		padding: 10,
		borderWidth: 1,
		borderRadius: 8,
		fontSize: 15,
		minHeight: 80,
		textAlignVertical: 'top',
	},
	customButtonRow: {
		flexDirection: 'row',
		gap: 10,
		margin: 12,
		marginTop: 0,
	},
	playButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
		borderRadius: 8,
		gap: 6,
	},
	stopButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		gap: 6,
	},
	buttonText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: 14,
	},
	stepper: {
		flexDirection: 'row',
		gap: 4,
	},
	stepBtn: {
		width: 32,
		height: 32,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(124,58,237,0.12)',
	},
});
