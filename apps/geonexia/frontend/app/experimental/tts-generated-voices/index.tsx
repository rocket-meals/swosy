import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	useTheme,
} from 'repo-depkit-common-ui';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import {
	generatedVoices,
	GeneratedVoiceEntry,
} from '../../../assets/tts-generated-voices/generatedVoicesIndex';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAY_COLOR = '#16a34a';
const STOP_COLOR = '#e53935';
const LANG_COLORS: Record<string, string> = {
	DE: '#facc15',
	EN: '#3b82f6',
	FR: '#6366f1',
	ES: '#f97316',
	IT: '#22c55e',
	PT: '#06b6d4',
	NL: '#ec4899',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectLanguage(key: string): string {
	return key.split('_')[0].toUpperCase();
}

function groupByLanguage(
	voices: Record<string, GeneratedVoiceEntry>,
): Record<string, { key: string; entry: GeneratedVoiceEntry }[]> {
	const groups: Record<string, { key: string; entry: GeneratedVoiceEntry }[]> = {};
	for (const [key, entry] of Object.entries(voices)) {
		const lang = detectLanguage(key);
		if (!groups[lang]) groups[lang] = [];
		groups[lang].push({ key, entry });
	}
	return groups;
}

const LANG_LABELS: Record<string, string> = {
	DE: 'Deutsch',
	EN: 'English',
	FR: 'Français',
	ES: 'Español',
	IT: 'Italiano',
	PT: 'Português',
	NL: 'Nederlands',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TTSGeneratedVoicesScreen() {
	const { theme } = useTheme();
	const [playingKey, setPlayingKey] = useState<string | null>(null);

	const groups = useMemo(() => groupByLanguage(generatedVoices), []);
	const voiceCount = Object.keys(generatedVoices).length;

	// Audio player – we load a new source each time the user taps play
	const player = useAudioPlayer(null);
	const status = useAudioPlayerStatus(player);

	// Detect when playback finishes and reset state
	const isPlaying = status.playing;
	const currentTime = status.currentTime;
	const duration = status.duration;
	React.useEffect(() => {
		if (!isPlaying && playingKey !== null && currentTime > 0 && currentTime >= duration - 0.1) {
			setPlayingKey(null);
		}
	}, [isPlaying, playingKey, currentTime, duration]);

	const handlePlay = useCallback(
		(key: string, entry: GeneratedVoiceEntry) => {
			if (playingKey === key) {
				// Stop current playback
				player.pause();
				setPlayingKey(null);
				return;
			}

			try {
				player.replace(entry.audio);
				player.play();
				setPlayingKey(key);
			} catch (err) {
				console.warn('[TTSGeneratedVoices] Playback error:', err);
				setPlayingKey(null);
			}
		},
		[player, playingKey],
	);

	const handleStopAll = useCallback(() => {
		player.pause();
		setPlayingKey(null);
	}, [player]);

	if (voiceCount === 0) {
		return (
			<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
				<View style={styles.emptyContainer}>
					<MaterialCommunityIcons name="volume-off" size={64} color={theme.text.secondary} />
					<Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
						No generated voices yet
					</Text>
					<Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
						Run the generate-tts-voices workflow to create MP3 voice files from voices.json.
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				{/* ── Summary ───────────────────────────────── */}
				<SettingsListGroupTitle title="Overview" />
				<SettingsList
					iconBgColor="#6366f1"
					leftIcon={<Ionicons name="musical-notes" size={22} color="#ffffff" />}
					label="Generated Voices"
					value={`${voiceCount} voices in ${Object.keys(groups).length} languages`}
					groupPosition="alone"
				/>

				{playingKey !== null && (
					<SettingsList
						iconBgColor={STOP_COLOR}
						leftIcon={<Ionicons name="stop" size={22} color="#ffffff" />}
						label="Stop Playback"
						value="Tap to stop the current voice"
						handleFunction={handleStopAll}
						groupPosition="alone"
					/>
				)}

				{/* ── Voice groups by language ─────────────── */}
				{Object.entries(groups).map(([lang, items]) => (
					<React.Fragment key={lang}>
						<SettingsListGroupTitle
							title={`${LANG_LABELS[lang] ?? lang} (${items.length})`}
						/>
						{items.map(({ key, entry }, idx) => {
							const isItemPlaying = playingKey === key;
							const groupPosition =
								items.length === 1
									? 'alone'
									: idx === 0
										? 'top'
										: idx === items.length - 1
											? 'bottom'
											: 'middle';

							return (
								<SettingsList
									key={key}
									iconBgColor={isItemPlaying ? STOP_COLOR : (LANG_COLORS[lang] ?? PLAY_COLOR)}
									leftIcon={
										isItemPlaying ? (
											<Ionicons name="stop" size={22} color="#ffffff" />
										) : (
											<Ionicons name="play" size={22} color="#ffffff" />
										)
									}
									label={entry.text}
									value={key}
									rightIcon={
										isItemPlaying ? (
											<MaterialCommunityIcons name="volume-high" size={20} color={STOP_COLOR} />
										) : (
											<Ionicons name="chevron-forward" size={20} color="#9ca3af" />
										)
									}
									handleFunction={() => handlePlay(key, entry)}
									groupPosition={groupPosition}
								/>
							);
						})}
					</React.Fragment>
				))}
			</ScrollView>
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingVertical: 16,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginTop: 16,
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: 14,
		marginTop: 8,
		textAlign: 'center',
		lineHeight: 20,
	},
});
