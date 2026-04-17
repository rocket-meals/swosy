import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { RateAppSettingsItem } from '@/components/RateAppSettingsItem/RateAppSettingsItem';

const RateApp = () => {
	useSetPageTitle(TranslationKeys.rate_app);
	const { theme } = useTheme();
	const { translate } = useLanguage();

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.screen.background }]}
			contentContainerStyle={{ backgroundColor: theme.screen.background }}
		>
			<View style={styles.content}>
				<Text style={[styles.heading, { color: theme.screen.text }]}>{translate(TranslationKeys.rate_app)}</Text>
				<RateAppSettingsItem debug />
			</View>
		</ScrollView>
	);
};

export default RateApp;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		width: '100%',
		height: '100%',
		padding: 20,
	},
	heading: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		marginVertical: 10,
	},
});
