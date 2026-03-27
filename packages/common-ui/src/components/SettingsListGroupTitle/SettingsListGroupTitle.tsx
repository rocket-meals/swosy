import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { horizontalScreenPadding } from '../../constants/ui';

export type SettingsListGroupTitleProps = {
	title: string;
};

const SettingsListGroupTitle: React.FC<SettingsListGroupTitleProps> = ({ title }) => {
	const { theme } = useTheme();

	return (
		<Text style={[styles.title, { color: theme.screen.placeholder }]}>
			{title}
		</Text>
	);
};

export default SettingsListGroupTitle;

const styles = StyleSheet.create({
	title: {
		fontSize: 13,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
		paddingHorizontal: horizontalScreenPadding,
		paddingTop: 16,
		paddingBottom: 6,
	},
});
