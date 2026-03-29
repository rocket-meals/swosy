import React, { useState, useCallback } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import * as Speech from 'expo-speech';
import { getLocales } from 'expo-localization';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';

import { buildKmAnnouncement, speakAnnouncement } from '../../../helpers/TTSHelper';

const PRIMARY_COLOR = '#2563eb';
const STOP_COLOR = '#e53935';
const BORDER_LIGHT = '#e5e7eb';
const BORDER_DARK = '#374151';

const KM_EXAMPLES: { km: number; pace: number | null }[] = [
	{ km: 1, pace: 6.5 },
	{ km: 5, pace: 5.25 },
	{ km: 10, pace: 4.75 },
	{ km: 21, pace: null },
];

export default function TTSTestScreen() {
	const { theme } = useTheme();
	const [customText, setCustomText] = useState('');

	const isDark = theme.background === '#222222';
	const borderColor = isDark ? BORDER_DARK : BORDER_LIGHT;

	const locale = getLocales()[0]?.languageTag ?? 'en-US';
	const langCode = locale.split('-')[0].toLowerCase();

	const handlePlayCustom = useCallback(() => {
		const text = customText.trim();
		if (!text) return;
		speakAnnouncement(text, langCode);
	}, [customText, langCode]);

	const handlePlayExample = useCallback(
		(km: number, pace: number | null) => {
			const text = buildKmAnnouncement(km, pace, locale);
			speakAnnouncement(text, langCode);
		},
		[locale, langCode],
	);

	const handleStop = useCallback(() => {
		Speech.stop();
	}, []);

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps="handled"
		>
			<SettingsListGroupTitle title="Custom Text" />
			<View style={[styles.card, { backgroundColor: theme.screen.background, borderColor }]}>
				<TextInput
					style={[styles.textInput, { color: theme.screen.text, borderColor }]}
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
						style={[styles.stopButton, { backgroundColor: STOP_COLOR }]}
						onPress={handleStop}
						activeOpacity={0.8}
					>
						<MaterialIcons name="stop" size={20} color="#ffffff" />
						<Text style={styles.buttonText}>Stop</Text>
					</TouchableOpacity>
				</View>
			</View>

			<SettingsListGroupTitle title={`Km Announcements (${locale})`} />
			<View style={[styles.card, { backgroundColor: theme.screen.background, borderColor }]}>
				{KM_EXAMPLES.map(({ km, pace }, index) => {
					const text = buildKmAnnouncement(km, pace, locale);
					return (
						<View
							key={km}
							style={[
								styles.exampleRow,
								index < KM_EXAMPLES.length - 1 && {
									borderBottomWidth: StyleSheet.hairlineWidth,
									borderBottomColor: borderColor,
								},
							]}
						>
							<View style={styles.exampleInfo}>
								<View style={styles.exampleBadge}>
									<MaterialCommunityIcons name="run" size={16} color={PRIMARY_COLOR} />
									<Text style={[styles.exampleKm, { color: PRIMARY_COLOR }]}>{km} km</Text>
								</View>
								<Text style={[styles.exampleText, { color: theme.screen.text }]} numberOfLines={2}>
									{text}
								</Text>
							</View>
							<TouchableOpacity
								style={styles.examplePlayButton}
								onPress={() => handlePlayExample(km, pace)}
								activeOpacity={0.8}
							>
								<MaterialIcons name="play-circle-filled" size={32} color={PRIMARY_COLOR} />
							</TouchableOpacity>
						</View>
					);
				})}
			</View>

			<SettingsListGroupTitle title="Device Language" />
			<View style={[styles.card, { backgroundColor: theme.screen.background, borderColor }]}>
				<View style={styles.infoRow}>
					<MaterialCommunityIcons name="translate" size={20} color={PRIMARY_COLOR} />
					<Text style={[styles.infoText, { color: theme.screen.text }]}>
						Locale: <Text style={styles.infoValue}>{locale}</Text>
					</Text>
				</View>
				<View style={[styles.infoRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor }]}>
					<MaterialCommunityIcons name="message-text-outline" size={20} color={PRIMARY_COLOR} />
					<Text style={[styles.infoText, { color: theme.screen.text }]}>
						Language: <Text style={styles.infoValue}>{langCode}</Text>
					</Text>
				</View>
			</View>
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
		borderWidth: StyleSheet.hairlineWidth,
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
	exampleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 10,
	},
	exampleInfo: {
		flex: 1,
		gap: 4,
	},
	exampleBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	exampleKm: {
		fontSize: 13,
		fontWeight: '700',
	},
	exampleText: {
		fontSize: 13,
		lineHeight: 18,
	},
	examplePlayButton: {
		padding: 4,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 10,
	},
	infoText: {
		fontSize: 14,
	},
	infoValue: {
		fontWeight: '600',
	},
});
