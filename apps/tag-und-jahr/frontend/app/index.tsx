import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YearClock from '../components/YearClock';
import { CLOCK_COLORS } from '../helpers/clockDesign';
import { syncWidgetTimeline } from '../helpers/widgetSync';

export default function Index() {
	const { width, height } = useWindowDimensions();
	const [now, setNow] = useState(() => new Date());

	// The in-app clock ticks once a minute - like the widget it is an object
	// for contemplation, not a precision instrument.
	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	// Refresh the widget timeline on every start and whenever the app returns
	// to the foreground, so the home screen widget always has ~7 days of
	// half-hour states scheduled.
	useEffect(() => {
		syncWidgetTimeline();
		const subscription = AppState.addEventListener('change', (state) => {
			if (state === 'active') {
				syncWidgetTimeline();
			}
		});
		return () => subscription.remove();
	}, []);

	const clockSize = Math.min(width, height) * 0.8;

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.clockContainer}>
				<YearClock size={clockSize} date={now} />
			</View>
			<Text style={styles.caption}>
				Der rote Strich steht für den 21. März und wandert in einem Jahr einmal im Kreis. Der blaue Punkt wandert einmal am Tag. Keine
				Uhrzeit - nur das Vergehen der Zeit.
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
