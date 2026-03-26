import React from 'react';
import { ActivityIndicator, Appearance, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '@/redux/hooks';
import { myContrastColor } from '@/helper/ColorHelper';
import { darkTheme, lightTheme } from '@/styles/themes';
import { AppButtonProps } from './types';

const AppButton: React.FC<AppButtonProps> = ({
	text,
	onPress,
	variant = 'primary',
	iconLeft,
	iconRight,
	style,
	textStyle,
	disabled = false,
	loading = false,
}) => {
	const { primaryColor, selectedTheme } = useAppSelector((state) => state.settings);
	const colorScheme = Appearance.getColorScheme();
	const theme = selectedTheme === 'systematic' ? (colorScheme === 'dark' ? darkTheme : lightTheme) : selectedTheme === 'dark' ? darkTheme : lightTheme;

	const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');

	const getBackgroundColor = () => {
		if (variant === 'primary') return primaryColor;
		if (variant === 'outline') return 'transparent';
		return 'transparent';
	};

	const getTextColor = () => {
		if (variant === 'primary') return contrastColor;
		if (variant === 'outline') return primaryColor;
		return theme.screen.text;
	};

	const getBorderColor = () => {
		if (variant === 'outline') return primaryColor;
		return 'transparent';
	};

	return (
		<TouchableOpacity
			style={[
				styles.container,
				{
					backgroundColor: getBackgroundColor(),
					borderColor: getBorderColor(),
					borderWidth: variant === 'outline' ? 1 : 0,
					opacity: disabled ? 0.6 : 1,
				},
				style,
			]}
			onPress={onPress}
			disabled={disabled || loading}
		>
			{loading ? (
				<ActivityIndicator color={getTextColor()} />
			) : (
				<>
					{iconLeft && <View>{iconLeft}</View>}
					<Text style={[styles.label, { color: getTextColor() }, textStyle]}>{text}</Text>
					{iconRight && <View>{iconRight}</View>}
				</>
			)}
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

export default AppButton;
