import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'repo-depkit-common-ui';
import { ComponentIds } from '../constants/ComponentIds';
import { sanitizeTimeDigits, padTimeDigits, parseTimeDigitsToSeconds, MAX_TIME_DIGITS } from '../helpers/CountdownTimeInput';

const PRIMARY_COLOR = '#2563eb';

// Same platform split as the other modal inputs (CardScoreEntryModal etc.):
// BottomSheetTextInput's blur handler breaks on react-native-web.
const ResolvedDigitsInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

/**
 * Custom countdown start time entry: a "00h 00m 00s" mask that fills from the
 * left as the user types digits on the num-pad keyboard (typing "123" shows
 * "12h 30m 00s"). Already-typed digits render in the regular text color, the
 * not-yet-typed zeros in the muted placeholder color. The keyboard input
 * itself lives in an invisible TextInput; the visible mask is just a
 * per-character colored rendering of its value.
 */
export default function CountdownTimeInputModal({
	onStart,
}: Readonly<{
	/** Called with the entered duration in seconds when the user confirms. */
	onStart: (totalSeconds: number) => void;
}>) {
	const { theme } = useTheme();
	const [digits, setDigits] = useState('');
	const inputRef = useRef<TextInput>(null);

	const totalSeconds = useMemo(() => parseTimeDigitsToSeconds(digits), [digits]);
	const canStart = totalSeconds > 0;

	// One entry per mask digit: its character plus whether the user already
	// typed it (digits fill the mask from the left, so index < digits.length).
	const maskDigits = useMemo(() => {
		return padTimeDigits(digits)
			.split('')
			.map((char, index) => ({ char, typed: index < digits.length }));
	}, [digits]);

	const handleChangeText = useCallback((text: string) => {
		setDigits(sanitizeTimeDigits(text));
	}, []);

	const handleClear = useCallback(() => {
		setDigits('');
		inputRef.current?.focus();
	}, []);

	const handleStart = useCallback(() => {
		if (!canStart) return;
		onStart(totalSeconds);
	}, [canStart, onStart, totalSeconds]);

	const focusInput = useCallback(() => {
		inputRef.current?.focus();
	}, []);

	const typedColor = theme.screen.text;
	const untypedColor = theme.screen.placeholder;

	// The mask is grouped as [0,1]h [2,3]m [4,5]s.
	const renderSegment = (startIndex: number, unit: string) => (
		<Text>
			{maskDigits.slice(startIndex, startIndex + 2).map((digit, offset) => (
				// eslint-disable-next-line react/no-array-index-key
				<Text key={startIndex + offset} style={{ color: digit.typed ? typedColor : untypedColor }}>
					{digit.char}
				</Text>
			))}
			<Text style={[styles.unitText, { color: untypedColor }]}>{unit}</Text>
		</Text>
	);

	return (
		<View style={styles.container}>
			<Text style={[styles.hint, { color: theme.screen.placeholder }]}>
				Zeit im Format HH:MM:SS eintippen - die Ziffern füllen sich von links
			</Text>

			{/* Visible mask - tapping it (re)opens the keyboard of the hidden input. */}
			<Pressable nativeID={ComponentIds.TIMER_CUSTOM_TIME_DISPLAY} onPress={focusInput} style={styles.displayRow}>
				<Text style={styles.maskText}>
					{renderSegment(0, 'h ')}
					{renderSegment(2, 'm ')}
					{renderSegment(4, 's')}
				</Text>
				<TouchableOpacity
					nativeID={ComponentIds.TIMER_CUSTOM_TIME_CLEAR_BUTTON}
					onPress={handleClear}
					activeOpacity={0.7}
					disabled={digits.length === 0}
					style={{ opacity: digits.length === 0 ? 0.3 : 1 }}
				>
					<Ionicons name="backspace-outline" size={26} color={theme.screen.text} />
				</TouchableOpacity>
			</Pressable>

			{/* Invisible input that actually receives the num-pad keystrokes. */}
			<ResolvedDigitsInput
				ref={inputRef as React.Ref<never>}
				nativeID={ComponentIds.TIMER_CUSTOM_TIME_INPUT}
				style={styles.hiddenInput}
				value={digits}
				onChangeText={handleChangeText}
				keyboardType="number-pad"
				returnKeyType="done"
				maxLength={MAX_TIME_DIGITS}
				autoFocus
				caretHidden
				onSubmitEditing={handleStart}
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
	displayRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 16,
		paddingVertical: 12,
	},
	maskText: {
		fontSize: 44,
		fontWeight: '300',
		fontVariant: ['tabular-nums'],
	},
	unitText: {
		fontSize: 24,
		fontWeight: '400',
	},
	hiddenInput: {
		position: 'absolute',
		width: 1,
		height: 1,
		opacity: 0,
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
