import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Props = {
	children: React.ReactNode;
	fontSize?: number;
	testID?: string;
};

const SettingsGroupTitle: React.FC<Props> = ({ children, fontSize, testID }) => {
	const { theme } = useTheme();
	return <Text testID={testID} accessibilityLabel={testID} style={[styles.heading, { color: theme.screen.text, ...(fontSize && { fontSize }) }]}>{children}</Text>;
};

export default SettingsGroupTitle;

const styles = StyleSheet.create({
	heading: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
		marginTop: 20,
		marginBottom: 4,
	},
});
