import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	useTheme,
} from 'repo-depkit-common-ui';
import * as Speech from 'expo-speech';

const PRIMARY_COLOR = '#2563eb';
const STOP_COLOR = '#e53935';
const VOICE_COLOR = '#7c3aed';

const VOICES = [
	{ key: 'de-DE', label: 'Deutsch (DE)' },
	{ key: 'en-US', label: 'English (US)' },
	{ key: 'fr-FR', label: 'Français (FR)' },
	{ key: 'es-ES', label: 'Español (ES)' },
];

export default function EdgeSpeechScreen() {
	const { theme } = useTheme();
	const [inputText, setInputText] = useState('2 Kilometer. Pace: 5 Minuten und 30 Sekunden.');
	const [selectedVoice, setSelectedVoice] = useState(VOICES[0].key);
	const [isSpeaking, setIsSpeaking] = useState(false);

	const handleSpeak = useCallback(() => {
		if (isSpeaking) {
			Speech.stop();
			setIsSpeaking(false);
			return;
		}
		const text = inputText.trim();
		if (!text) return;
		setIsSpeaking(true);
		Speech.stop();
		Speech.speak(text, {
			language: selectedVoice,
			onDone: () => setIsSpeaking(false),
			onStopped: () => setIsSpeaking(false),
			onError: () => setIsSpeaking(false),
		});
	}, [inputText, selectedVoice, isSpeaking]);

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			<SettingsListGroupTitle title="Text" />
			<View style={[styles.card, { backgroundColor: theme.screen.iconBg }]}>
				<TextInput
					style={[styles.textInput, { color: theme.screen.text, borderColor: theme.screen.background }]}
					placeholder="Text zum Sprechen eingeben…"
					placeholderTextColor={theme.screen.placeholder}
					value={inputText}
					onChangeText={setInputText}
					multiline
					numberOfLines={4}
					returnKeyType="done"
				/>
			</View>

			<SettingsListGroupTitle title="Voice" />
			{VOICES.map((voice, index) => {
				const isFirst = index === 0;
				const isLast = index === VOICES.length - 1;
				const groupPosition = isFirst && isLast ? 'single' : isFirst ? 'top' : isLast ? 'bottom' : 'middle';
				return (
					<SettingsList
						key={voice.key}
						iconBgColor={selectedVoice === voice.key ? PRIMARY_COLOR : VOICE_COLOR}
						leftIcon={<MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />}
						label={voice.label}
						value={selectedVoice === voice.key ? '✓ Selected' : ''}
						handleFunction={() => setSelectedVoice(voice.key)}
						groupPosition={groupPosition}
					/>
				);
			})}

			<SettingsListGroupTitle title="Playback" />
			<View style={[styles.card, { backgroundColor: theme.screen.iconBg }]}>
				<View style={styles.buttonRow}>
					<TouchableOpacity
						style={[styles.playButton, { backgroundColor: isSpeaking ? STOP_COLOR : PRIMARY_COLOR }]}
						onPress={handleSpeak}
						activeOpacity={0.8}
					>
						<MaterialIcons name={isSpeaking ? 'stop' : 'play-arrow'} size={20} color="#ffffff" />
						<Text style={styles.buttonText}>{isSpeaking ? 'Stop' : 'Speak'}</Text>
					</TouchableOpacity>
				</View>
			</View>

			<SettingsListGroupTitle title="Status" />
			<SettingsList
				iconBgColor={isSpeaking ? PRIMARY_COLOR : '#6b7280'}
				leftIcon={<MaterialCommunityIcons name={isSpeaking ? 'volume-high' : 'volume-off'} size={22} color="#ffffff" />}
				label="Status"
				value={isSpeaking ? 'Spricht…' : 'Bereit'}
				groupPosition="single"
			/>
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
	buttonRow: {
		flexDirection: 'row',
		gap: 10,
		margin: 12,
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
	buttonText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: 14,
	},
});
