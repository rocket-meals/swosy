import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CLOCK_COLORS } from '../helpers/clockDesign';

export default function Layout() {
	return (
		<>
			<StatusBar style="light" />
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: CLOCK_COLORS.background },
				}}
			/>
		</>
	);
}
