import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';
import { useRouter } from 'expo-router';

const EXPERIMENTAL_COLOR = '#7c3aed';

export default function ExperimentalScreen() {
	const { theme } = useTheme();
	const router = useRouter();

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<SettingsListGroupTitle title="Audio" />
				<SettingsList
					iconBgColor={EXPERIMENTAL_COLOR}
					leftIcon={<MaterialCommunityIcons name="account-voice" size={22} color="#ffffff" />}
					label="Text to Speech Test"
					value="Voice announcements playground"
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => router.push('/experimental/tts-test')}
					groupPosition="single"
				/>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingVertical: 16,
	},
});
