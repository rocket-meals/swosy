import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeInputFields, useTheme } from 'repo-depkit-common-ui';
import { ComponentIds } from '../constants/ComponentIds';

const PRIMARY_COLOR = '#2563eb';

/**
 * Custom countdown start time entry: three 2-digit segment fields (hours,
 * minutes, seconds) in the style of the Material time picker - typing the
 * second digit advances to the next field, backspace in an empty field jumps
 * back (see common-ui's TimeInputFields). Confirming starts the countdown
 * with the entered duration.
 */
export default function CountdownTimeInputModal({
	onStart,
}: Readonly<{
	/** Called with the entered duration in seconds when the user confirms. */
	onStart: (totalSeconds: number) => void;
}>) {
	const { theme } = useTheme();
	const [totalSeconds, setTotalSeconds] = useState(0);
	const canStart = totalSeconds > 0;

	const handleStart = useCallback(() => {
		if (totalSeconds <= 0) return;
		onStart(totalSeconds);
	}, [onStart, totalSeconds]);

	return (
		<View style={styles.container}>
			<Text style={[styles.hint, { color: theme.screen.placeholder }]}>Startzeit eingeben (Stunden : Minuten : Sekunden)</Text>

			<TimeInputFields
				onChange={setTotalSeconds}
				autoFocus
				primaryColor={PRIMARY_COLOR}
				nativeIDPrefix={ComponentIds.TIMER_CUSTOM_TIME_FIELD_PREFIX}
				onSubmit={handleStart}
			/>

			<TouchableOpacity
				nativeID={ComponentIds.TIMER_CUSTOM_TIME_START_BUTTON}
				style={[styles.startButton, { backgroundColor: PRIMARY_COLOR, opacity: canStart ? 1 : 0.5 }]}
				onPress={handleStart}
				disabled={!canStart}
				activeOpacity={0.8}
			>
				<Ionicons name="play" size={20} color="#ffffff" />
				<Text style={styles.startButtonText}>Countdown starten</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 10,
	},
	hint: {
		fontSize: 13,
		textAlign: 'center',
		marginBottom: 16,
	},
	startButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		height: 52,
		borderRadius: 12,
		marginTop: 16,
	},
	startButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
});
