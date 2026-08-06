import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { getImpressumMarkdown } from 'repo-depkit-common';
import { SimpleMarkdown, useTheme } from 'repo-depkit-common-ui';

export default function ImpressumScreen() {
	const { theme } = useTheme();

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]} contentContainerStyle={styles.content}>
			<SimpleMarkdown content={getImpressumMarkdown()} />
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
