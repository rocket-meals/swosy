import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';

type Props = {
	children: React.ReactNode;
	fontSize?: number;
};

const SettingsGroupTitle: React.FC<Props> = ({ children, fontSize }) => {
	const { theme } = useTheme();
	const { language } = useLanguage();
	const isRtl = language === 'ar';
	return <Text style={[styles.heading, { color: theme.screen.text, ...(fontSize && { fontSize }), textAlign: isRtl ? 'right' : 'left', alignSelf: isRtl ? 'flex-end' : 'flex-start', writingDirection: isRtl ? 'rtl' : 'ltr' }]}>{children}</Text>;
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
