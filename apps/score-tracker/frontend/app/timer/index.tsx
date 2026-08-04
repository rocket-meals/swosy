import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SettingsListGroupTitle, useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';
import { ComponentIds } from '../../constants/ComponentIds';
import CountdownTimeInputModal from '../../components/CountdownTimeInputModal';
import { generateId } from '../../helpers/RandomHelper';

const PRIMARY_COLOR = '#2563eb';
const DANGER_COLOR = '#dc2626';

// Countdown presets in seconds - useful for timed game rounds.
const COUNTDOWN_PRESETS = [30, 60, 120, 300];

type TimerMode = 'stopwatch' | 'countdown';

function formatTime(totalMs: number): string {
	const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const minSec = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	// Hours only appear for custom start times beyond an hour.
	return hours > 0 ? `${hours}:${minSec}` : minSec;
}

function formatPreset(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	return `${seconds / 60} min`;
}

export default function TimerScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const [mode, setMode] = useState<TimerMode>('stopwatch');
	// Countdown duration in ms; only relevant in countdown mode.
	const [countdownMs, setCountdownMs] = useState(60_000);
	const [isRunning, setIsRunning] = useState(false);
	// Elapsed time in ms (in both modes we count up and derive the remaining time).
	const [elapsedMs, setElapsedMs] = useState(0);
	// Identifies the current timer run. Starting a preset while the timer is already
	// running keeps isRunning at true, so a fresh id forces the tick effect to
	// re-anchor instead of continuing from the old start timestamp.
	const [runId, setRunId] = useState<string>(() => generateId());

	// Tick while running. Interval-based (250ms) with a start-timestamp anchor so
	// the display stays accurate even when intervals fire late.
	const startRef = useRef<number | null>(null);
	useEffect(() => {
		if (!isRunning) return undefined;
		startRef.current = Date.now() - elapsedMs;
		const interval = setInterval(() => {
			if (startRef.current != null) {
				setElapsedMs(Date.now() - startRef.current);
			}
		}, 250);
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isRunning, runId]);

	const remainingMs = countdownMs - elapsedMs;
	const isFinished = mode === 'countdown' && remainingMs <= 0;

	// Stop automatically when a countdown reaches zero.
	useEffect(() => {
		if (isFinished && isRunning) {
			setIsRunning(false);
		}
	}, [isFinished, isRunning]);

	const handleStartPause = useCallback(() => {
		if (isFinished) return;
		setIsRunning((running) => !running);
	}, [isFinished]);

	const handleReset = useCallback(() => {
		setIsRunning(false);
		setElapsedMs(0);
	}, []);

	const handleSelectMode = useCallback((newMode: TimerMode) => {
		setMode(newMode);
		setIsRunning(false);
		setElapsedMs(0);
	}, []);

	const handleSelectPreset = useCallback((seconds: number) => {
		setMode('countdown');
		setCountdownMs(seconds * 1000);
		setElapsedMs(0);
		setRunId(generateId());
		setIsRunning(true);
	}, []);

	const handleStartCustomTime = useCallback(
		(seconds: number) => {
			closeModal();
			handleSelectPreset(seconds);
		},
		[closeModal, handleSelectPreset],
	);

	const handleOpenCustomTime = useCallback(() => {
		showModal({
			title: '⏱️ Eigene Startzeit',
			children: <CountdownTimeInputModal onStart={handleStartCustomTime} />,
		});
	}, [showModal, handleStartCustomTime]);

	const displayMs = mode === 'countdown' ? remainingMs : elapsedMs;
	const displayColor = isFinished ? DANGER_COLOR : theme.screen.text;

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background, paddingLeft: insets.left, paddingRight: insets.right }]}>
			<ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
				{/* Mode toggle */}
				<View style={[styles.modeToggle, { backgroundColor: theme.screen.iconBg }]}>
					<TouchableOpacity
						style={[styles.modeButton, mode === 'stopwatch' && { backgroundColor: PRIMARY_COLOR }]}
						onPress={() => handleSelectMode('stopwatch')}
						activeOpacity={0.7}
					>
						<Ionicons name="stopwatch-outline" size={18} color={mode === 'stopwatch' ? '#ffffff' : theme.screen.text} />
						<Text style={[styles.modeButtonText, { color: mode === 'stopwatch' ? '#ffffff' : theme.screen.text }]}>Stoppuhr</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.modeButton, mode === 'countdown' && { backgroundColor: PRIMARY_COLOR }]}
						onPress={() => handleSelectMode('countdown')}
						activeOpacity={0.7}
					>
						<Ionicons name="hourglass-outline" size={18} color={mode === 'countdown' ? '#ffffff' : theme.screen.text} />
						<Text style={[styles.modeButtonText, { color: mode === 'countdown' ? '#ffffff' : theme.screen.text }]}>Countdown</Text>
					</TouchableOpacity>
				</View>

				{/* Time display */}
				<View style={styles.displayWrapper}>
					<Text style={[styles.timeText, { color: displayColor }]} numberOfLines={1} adjustsFontSizeToFit>
						{formatTime(displayMs)}
					</Text>
					{isFinished && <Text style={[styles.finishedText, { color: DANGER_COLOR }]}>⏰ Zeit abgelaufen!</Text>}
				</View>

				{/* Start/Pause + Reset */}
				<View style={styles.buttonsRow}>
					<TouchableOpacity
						nativeID={ComponentIds.TIMER_RESET_BUTTON}
						style={[styles.roundButton, { backgroundColor: theme.screen.iconBg }]}
						onPress={handleReset}
						activeOpacity={0.8}
					>
						<Ionicons name="refresh-outline" size={28} color={theme.screen.text} />
					</TouchableOpacity>
					<TouchableOpacity
						nativeID={ComponentIds.TIMER_START_PAUSE_BUTTON}
						style={[styles.roundButtonLarge, { backgroundColor: isRunning ? DANGER_COLOR : PRIMARY_COLOR, opacity: isFinished ? 0.5 : 1 }]}
						onPress={handleStartPause}
						disabled={isFinished}
						activeOpacity={0.8}
					>
						<Ionicons name={isRunning ? 'pause' : 'play'} size={40} color="#ffffff" />
					</TouchableOpacity>
					{/* Spacer keeps the play button centered */}
					<View style={styles.roundButton} />
				</View>

				{/* Countdown presets */}
				<SettingsListGroupTitle title="Schnellstart Countdown" />
				<View style={styles.presetsRow}>
					{COUNTDOWN_PRESETS.map((seconds) => (
						<TouchableOpacity
							key={seconds}
							style={[styles.presetButton, { borderColor: PRIMARY_COLOR }]}
							onPress={() => handleSelectPreset(seconds)}
							activeOpacity={0.7}
						>
							<Text style={[styles.presetButtonText, { color: PRIMARY_COLOR }]}>{formatPreset(seconds)}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Custom countdown start time (opens the HH:MM:SS entry modal) */}
				<TouchableOpacity
					nativeID={ComponentIds.TIMER_CUSTOM_TIME_BUTTON}
					style={[styles.customTimeButton, { borderColor: PRIMARY_COLOR }]}
					onPress={handleOpenCustomTime}
					activeOpacity={0.7}
				>
					<Ionicons name="create-outline" size={18} color={PRIMARY_COLOR} />
					<Text style={[styles.presetButtonText, { color: PRIMARY_COLOR }]}>Eigene Startzeit</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	modeToggle: {
		flexDirection: 'row',
		borderRadius: 12,
		padding: 4,
		gap: 4,
	},
	modeButton: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 10,
		borderRadius: 9,
	},
	modeButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	displayWrapper: {
		alignItems: 'center',
		paddingVertical: 48,
	},
	timeText: {
		fontSize: 84,
		fontWeight: '200',
		fontVariant: ['tabular-nums'],
	},
	finishedText: {
		fontSize: 16,
		fontWeight: '600',
		marginTop: 8,
	},
	buttonsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 24,
	},
	roundButton: {
		width: 64,
		height: 64,
		borderRadius: 32,
		justifyContent: 'center',
		alignItems: 'center',
	},
	roundButtonLarge: {
		width: 88,
		height: 88,
		borderRadius: 44,
		justifyContent: 'center',
		alignItems: 'center',
	},
	presetsRow: {
		flexDirection: 'row',
		gap: 10,
	},
	presetButton: {
		flex: 1,
		borderWidth: 1.5,
		borderRadius: 10,
		paddingVertical: 12,
		alignItems: 'center',
	},
	presetButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
	customTimeButton: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
		borderWidth: 1.5,
		borderRadius: 10,
		paddingVertical: 12,
		marginTop: 10,
	},
});
