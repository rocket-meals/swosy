import React, { ReactNode } from 'react';
import { Appearance, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { myContrastColor } from '@/helper/ColorHelper';
import { darkTheme, lightTheme } from '@/styles/themes';

export interface ProjectButtonProps {
	text: string;
	onPress?: () => void;
	iconLeft?: ReactNode;
	iconRight?: ReactNode;
	backgroundColor?: string;
	style?: StyleProp<ViewStyle>;
}

const ProjectButton: React.FC<ProjectButtonProps> = ({ text, onPress, iconLeft, iconRight, backgroundColor, style }) => {
	const { primaryColor, selectedTheme } = useSelector((state: RootState) => state.settings);

	const colorScheme = Appearance.getColorScheme();
	const theme = selectedTheme === 'systematic' ? (colorScheme === 'dark' ? darkTheme : lightTheme) : selectedTheme === 'dark' ? darkTheme : lightTheme;

	const resolvedBackgroundColor = backgroundColor ?? primaryColor;
	const contrastColor = myContrastColor(resolvedBackgroundColor, theme, selectedTheme === 'dark');

	return (
		<TouchableOpacity style={[styles.container, { backgroundColor: resolvedBackgroundColor }, style]} onPress={onPress}>
			{iconLeft}
			<Text style={[styles.label, { color: contrastColor }]}>{text}</Text>
			{iconRight}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
		marginVertical: 20,
		gap: 10,
		paddingHorizontal: 18,
		height: 43,
	},
	label: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
});

export default ProjectButton;
