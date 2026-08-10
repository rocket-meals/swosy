import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YearClock from '../components/YearClock';
import { CLOCK_COLORS } from '../helpers/clockDesign';
import { ClockSettings, DEFAULT_CLOCK_SETTINGS, loadClockSettingsAsync } from '../helpers/clockSettings';
import { refreshFoodWidgetFromStoredSettingsAsync, syncWidgetTimeline } from '../helpers/widgetSync';

export default function Index() {
	const { width, height } = useWindowDimensions();
	const [now, setNow] = useState(() => new Date());
	const [clockSettings, setClockSettings] = useState<ClockSettings>(DEFAULT_CLOCK_SETTINGS);

	// The in-app clock ticks once a minute - like the widget it is an object
	// for contemplation, not a precision instrument.
	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	// Reload the display options whenever this screen gains focus, so changes
	// made in the settings screen show up immediately.
	useFocusEffect(
		useCallback(() => {
			loadClockSettingsAsync().then(setClockSettings);
		}, [])
	);

	// Refresh the widget timelines on every start and whenever the app returns
	// to the foreground: the year clock gets ~7 days of half-hour states (with
	// the current display options as props), the experimental food widget gets
	// today's menu (if configured in settings).
	useEffect(() => {
		loadClockSettingsAsync().then((settings) => syncWidgetTimeline(settings));
		refreshFoodWidgetFromStoredSettingsAsync();
		const subscription = AppState.addEventListener('change', (state) => {
			if (state === 'active') {
				loadClockSettingsAsync().then((settings) => syncWidgetTimeline(settings));
				refreshFoodWidgetFromStoredSettingsAsync();
			}
		});
		return () => subscription.remove();
	}, []);

	const clockSize = Math.min(width, height) * 0.8;

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.clockContainer}>
				<YearClock size={clockSize} date={now} settings={clockSettings} />
			</View>
			<Text style={styles.caption}>
				{clockSettings.yearStart === 'newyear'
					? 'Der rote Strich steht für den 1. Januar und wandert in einem Jahr einmal im Kreis. '
					: 'Der rote Strich steht für den 21. März und wandert in einem Jahr einmal im Kreis. '}
				{clockSettings.dayDisplay === 'sunmoon'
					? 'Sonne und Mond wandern über den Horizont: Sonne von 06:00 bis 18:00, Mond in der Nacht.'
					: 'Der blaue Punkt wandert einmal am Tag. Keine Uhrzeit - nur das Vergehen der Zeit.'}
			</Text>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: CLOCK_COLORS.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	clockContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	caption: {
		color: '#c8cfdc',
		fontSize: 13,
		lineHeight: 19,
		textAlign: 'center',
		paddingHorizontal: 32,
		paddingBottom: 24,
	},
});
