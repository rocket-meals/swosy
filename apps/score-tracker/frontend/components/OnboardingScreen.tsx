import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'repo-depkit-common-ui';
import { useDispatch } from 'react-redux';
import { setOnboardingCompleted } from '../store/appSettingsSlice';
import type { AppDispatch } from '../store/store';
import { ComponentIds } from '../constants/ComponentIds';
import { getCustomerConfig } from '../config';

const PRIMARY_COLOR = '#2563eb';

type OnboardingStep = {
	icon: keyof typeof Ionicons.glyphMap;
	iconColor: string;
	title: string;
	text: string;
};

// First-launch tour: one card per core area of the app. Shown by the gate in
// app/_layout.tsx until `appSettings.onboardingCompleted` is true; the settings
// screen can reset that flag to replay the tour ("Einführung erneut ansehen").
function buildSteps(appName: string): OnboardingStep[] {
	return [
		{
			icon: 'game-controller-outline',
			iconColor: PRIMARY_COLOR,
			title: `Willkommen bei ${appName}`,
			text: 'Dein Punktezähler für Brett-, Karten- und Würfelspiele. Alle Daten bleiben nur auf deinem Gerät - keine Konten, keine Werbung, kein Tracking.',
		},
		{
			icon: 'dice-outline',
			iconColor: '#16a34a',
			title: 'Spiele & Partien',
			text: 'Lege deine Lieblingsspiele an, starte Partien und erfasse Punkte Runde für Runde. Beendete Partien landen automatisch in der Historie des Spiels.',
		},
		{
			icon: 'people-outline',
			iconColor: '#f59e0b',
			title: 'Freunde',
			text: 'Speichere deine Mitspieler mit Name, Farbe und Avatar. Beim nächsten Spieleabend sind alle mit einem Tipp wieder am Tisch.',
		},
		{
			icon: 'stopwatch-outline',
			iconColor: '#dc2626',
			title: 'Timer & Würfel',
			text: 'Stoppuhr, Countdown und digitale Würfel sind eingebaut - für Spiele mit Zeitdruck oder wenn mal ein Würfel fehlt.',
		},
	];
}

export default function OnboardingScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch<AppDispatch>();
	const [stepIndex, setStepIndex] = useState(0);

	const steps = buildSteps(getCustomerConfig().projectName);
	const step = steps[stepIndex] ?? steps[0];
	const isLastStep = stepIndex === steps.length - 1;

	const handleFinish = useCallback(() => {
		dispatch(setOnboardingCompleted(true));
	}, [dispatch]);

	const handleNext = useCallback(() => {
		if (stepIndex === steps.length - 1) {
			handleFinish();
			return;
		}
		setStepIndex((index) => index + 1);
	}, [stepIndex, steps.length, handleFinish]);

	const handleBack = useCallback(() => {
		setStepIndex((index) => Math.max(0, index - 1));
	}, []);

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: theme.screen.background,
					paddingTop: insets.top + 16,
					paddingBottom: insets.bottom + 24,
					paddingLeft: insets.left + 24,
					paddingRight: insets.right + 24,
				},
			]}
		>
			<StatusBar style="auto" />
			<View style={styles.skipRow}>
				<TouchableOpacity
					nativeID={ComponentIds.ONBOARDING_SKIP_BUTTON}
					onPress={handleFinish}
					hitSlop={12}
					accessibilityRole="button"
				>
					<Text style={[styles.skipText, { color: theme.screen.placeholder }]}>Überspringen</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<View style={[styles.iconCircle, { backgroundColor: step.iconColor + '20' }]}>
					<Ionicons name={step.icon} size={72} color={step.iconColor} />
				</View>
				<Text style={[styles.title, { color: theme.screen.text }]}>{step.title}</Text>
				<Text style={[styles.text, { color: theme.screen.placeholder }]}>{step.text}</Text>
			</View>

			<View style={styles.dotsRow}>
				{steps.map((dotStep, index) => (
					<View
						key={dotStep.title}
						style={[
							styles.dot,
							{ backgroundColor: index === stepIndex ? PRIMARY_COLOR : theme.screen.border },
						]}
					/>
				))}
			</View>

			<View style={styles.buttonRow}>
				{stepIndex > 0 ? (
					<TouchableOpacity
						nativeID={ComponentIds.ONBOARDING_BACK_BUTTON}
						style={[styles.backButton, { borderColor: theme.screen.border }]}
						onPress={handleBack}
						activeOpacity={0.7}
						accessibilityRole="button"
					>
						<Ionicons name="arrow-back" size={22} color={theme.screen.text} />
					</TouchableOpacity>
				) : (
					<View style={styles.backButtonPlaceholder} />
				)}
				<TouchableOpacity
					nativeID={ComponentIds.ONBOARDING_NEXT_BUTTON}
					style={[styles.nextButton, { backgroundColor: PRIMARY_COLOR }]}
					onPress={handleNext}
					activeOpacity={0.8}
					accessibilityRole="button"
				>
					<Text style={styles.nextButtonText}>{isLastStep ? "Los geht's!" : 'Weiter'}</Text>
					{!isLastStep && <Ionicons name="arrow-forward" size={20} color="#ffffff" />}
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	skipRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	skipText: {
		fontSize: 16,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 24,
	},
	iconCircle: {
		width: 160,
		height: 160,
		borderRadius: 80,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		textAlign: 'center',
	},
	text: {
		fontSize: 17,
		lineHeight: 25,
		textAlign: 'center',
		maxWidth: 480,
	},
	dotsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 24,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	buttonRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	backButton: {
		width: 54,
		height: 54,
		borderRadius: 27,
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	backButtonPlaceholder: {
		width: 54,
		height: 54,
	},
	nextButton: {
		flex: 1,
		height: 54,
		borderRadius: 27,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 8,
	},
	nextButtonText: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '600',
	},
});
