import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SettingsList } from 'repo-depkit-common-ui';
import Constants from 'expo-constants';

const PRIMARY_COLOR = '#2563eb';

export default function SettingsScreen() {
	const [darkMode, setDarkMode] = useState(false);
	const [notifications, setNotifications] = useState(true);

	const appVersion = Constants.expoConfig?.version ?? '1.0.0';

	const items = [
		{
			key: 'appearance-header',
			type: 'header',
			label: 'Appearance',
		},
		{
			key: 'theme',
			type: 'item',
			label: 'Dark Mode',
			value: darkMode ? 'On' : 'Off',
			iconBgColor: PRIMARY_COLOR,
			leftIcon: (
				<MaterialCommunityIcons
					name="theme-light-dark"
					size={22}
					color="#ffffff"
				/>
			),
			rightIcon: <Ionicons name="chevron-forward" size={20} color="#9ca3af" />,
			handleFunction: () => setDarkMode((prev) => !prev),
			groupPosition: 'single' as const,
		},
		{
			key: 'notifications-header',
			type: 'header',
			label: 'Notifications',
		},
		{
			key: 'push-notifications',
			type: 'item',
			label: 'Push Notifications',
			value: notifications ? 'Enabled' : 'Disabled',
			iconBgColor: '#16a34a',
			leftIcon: (
				<Ionicons name="notifications-outline" size={22} color="#ffffff" />
			),
			rightIcon: <Ionicons name="chevron-forward" size={20} color="#9ca3af" />,
			handleFunction: () => setNotifications((prev) => !prev),
			groupPosition: 'single' as const,
		},
		{
			key: 'about-header',
			type: 'header',
			label: 'About',
		},
		{
			key: 'version',
			type: 'item',
			label: 'App Version',
			value: appVersion,
			iconBgColor: '#6b7280',
			leftIcon: <Feather name="info" size={22} color="#ffffff" />,
			groupPosition: 'top' as const,
		},
		{
			key: 'open-source',
			type: 'item',
			label: 'Open Source',
			value: 'View licenses',
			iconBgColor: '#6b7280',
			leftIcon: <Feather name="code" size={22} color="#ffffff" />,
			rightIcon: <Ionicons name="chevron-forward" size={20} color="#9ca3af" />,
			handleFunction: () => {},
			groupPosition: 'bottom' as const,
		},
	];

	return (
		<View style={styles.container}>
			<FlatList
				data={items}
				keyExtractor={(item) => item.key}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => {
					if (item.type === 'header') {
						return (
							<Text style={styles.sectionHeader}>{item.label}</Text>
						);
					}
					return (
						<SettingsList
							primaryColor={item.iconBgColor ?? PRIMARY_COLOR}
							iconBgColor={item.iconBgColor}
							leftIcon={item.leftIcon}
							label={item.label}
							value={item.value}
							rightIcon={item.rightIcon}
							handleFunction={item.handleFunction}
							groupPosition={item.groupPosition}
						/>
					);
				}}
			/>
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
	sectionHeader: {
		fontSize: 13,
		fontWeight: '600',
		color: '#6b7280',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 6,
	},
});
