import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { CustomMarkdown, useTheme } from 'repo-depkit-common-ui';
import { getPrivacyPolicyMarkdown } from '../../constants/PrivacyPolicy';

export default function PrivacyPolicyScreen() {
	const { theme } = useTheme();

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]} contentContainerStyle={styles.content}>
			<CustomMarkdown content={getPrivacyPolicyMarkdown()} collapsibleSections />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
});
