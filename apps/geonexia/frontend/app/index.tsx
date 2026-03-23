import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Geonexia</Text>
				<Text style={styles.subtitle}>Welcome</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 12,
	},
	title: {
		fontSize: 36,
		fontWeight: '700',
		color: '#111111',
		letterSpacing: 1,
	},
	subtitle: {
		fontSize: 16,
		fontWeight: '400',
		color: '#666666',
	},
});
