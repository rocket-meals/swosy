import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListBoolean,
	SettingsListGroupTitle,
} from 'repo-depkit-common-ui';
import Constants from 'expo-constants';

const PRIMARY_COLOR = '#2563eb';
const NOTIFICATION_COLOR = '#16a34a';
const NEUTRAL_COLOR = '#6b7280';

export default function SettingsScreen() {
	const [darkMode, setDarkMode] = useState(false);
	const [notifications, setNotifications] = useState(true);

	const appVersion = Constants.expoConfig?.version ?? '1.0.0';

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={styles.listContent}>
				<SettingsListGroupTitle title="Appearance" />
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={
						<MaterialCommunityIcons name="theme-light-dark" size={22} color="#ffffff" />
					}
					label="Dark Mode"
					value={darkMode ? 'On' : 'Off'}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => setDarkMode((prev) => !prev)}
					groupPosition="single"
				/>

				<SettingsListGroupTitle title="Notifications" />
				<SettingsListBoolean
					iconBgColor={NOTIFICATION_COLOR}
					leftIcon={<Ionicons name="notifications-outline" size={22} color="#ffffff" />}
					label="Push Notifications"
					isEnabled={notifications}
					onToggle={() => setNotifications((prev) => !prev)}
					valueActive="Enabled"
					valueInactive="Disabled"
					groupPosition="single"
				/>

				<SettingsListGroupTitle title="About" />
				<SettingsList
					iconBgColor={NEUTRAL_COLOR}
					leftIcon={<Feather name="info" size={22} color="#ffffff" />}
					label="App Version"
					value={appVersion}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={NEUTRAL_COLOR}
					leftIcon={<Feather name="code" size={22} color="#ffffff" />}
					label="Open Source"
					value="View licenses"
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={() => {}}
					groupPosition="bottom"
				/>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f3f4f6',
	},
	listContent: {
		paddingVertical: 16,
	},
});
