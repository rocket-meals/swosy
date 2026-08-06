import React from 'react';
import { Dimensions, DimensionValue, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { myContrastColor } from '../../helpers/ColorHelper';

export type MarkdownRedirectButtonProps = {
	type: 'email' | 'tel' | 'link' | 'location';
	label: string;
	backgroundColor?: string;
	color?: string;
	onClick?: () => void;
};

const MarkdownRedirectButton: React.FC<MarkdownRedirectButtonProps> = ({ type, label, backgroundColor, color, onClick }) => {
	const { theme, isDark } = useTheme();
	const isWeb = Platform.OS === 'web';
	const resolvedBackground = backgroundColor || theme.primary;
	const contrastColor = myContrastColor(resolvedBackground, theme, isDark);

	let containerWidth: DimensionValue;
	let fontSize: number;
	if (isWeb) {
		const windowWidth = Dimensions.get('window').width;
		if (windowWidth < 530) {
			containerWidth = 280;
			fontSize = 12;
		} else {
			containerWidth = 320;
			fontSize = 15;
		}
	} else {
		fontSize = 12;
		containerWidth = '100%';
	}

	let typeIcon: React.ReactNode;
	if (type === 'email') {
		typeIcon = <MaterialCommunityIcons name="email" size={24} color={color || contrastColor} />;
	} else if (type === 'tel') {
		typeIcon = <FontAwesome6 name="phone" size={20} color={color || contrastColor} />;
	} else if (type === 'location') {
		typeIcon = <Ionicons name="navigate" size={24} color={color || contrastColor} />;
	} else {
		typeIcon = <FontAwesome6 name="arrow-up-right-from-square" size={20} color={color || contrastColor} />;
	}

	return (
		<TouchableOpacity
			style={[styles.container, { width: containerWidth, height: isWeb ? 50 : 43, backgroundColor: resolvedBackground }]}
			onPress={onClick}
		>
			{typeIcon}
			<Text style={[styles.label, { color: color || contrastColor, fontSize }]}>{label}</Text>
		</TouchableOpacity>
	);
};

export default MarkdownRedirectButton;

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
		marginVertical: 20,
		paddingHorizontal: 18,
		gap: 10,
	},
	label: {
		fontSize: 16,
	},
});
