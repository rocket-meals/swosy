import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** General-purpose color palette (suitable for accents, player colors, etc.) */
export const PRESET_COLORS = [
	'#2563eb', // blue
	'#dc2626', // red
	'#16a34a', // green
	'#ea580c', // orange
	'#9333ea', // purple
	'#0891b2', // cyan
	'#ca8a04', // yellow
	'#db2777', // pink
];

/** Natural hair color palette */
export const HAIR_COLORS = [
	'#000000', // Black
	'#2c1b18', // Dark Brown
	'#4a312c', // Brown
	'#724133', // Light Brown
	'#a55728', // Auburn
	'#b55239', // Red-Brown
	'#d6b370', // Blonde
	'#e8d9b4', // Light Blonde
	'#f59797', // Red
	'#9c6442', // Chestnut
	'#b7a69e', // Gray
	'#d0cfc5', // Light Gray
	'#ffffff', // White
];

/** Human skin tone palette */
export const SKIN_COLORS = [
	'#fddbb4', // Very Light
	'#edb98a', // Light
	'#d08b5b', // Medium Light
	'#ae5d29', // Medium
	'#694d3d', // Medium Dark
	'#4a312c', // Dark
];

export type MyColorPickerProps = {
	colors: string[];
	selectedColor: string | null;
	onSelect: (color: string) => void;
};

const MyColorPicker: React.FC<MyColorPickerProps> = ({ colors, selectedColor, onSelect }) => {
	return (
		<View style={styles.container}>
			{colors.map((color) => (
				<TouchableOpacity
					key={color}
					style={[
						styles.swatch,
						{ backgroundColor: color },
						selectedColor?.toLowerCase() === color.toLowerCase() && styles.swatchSelected,
					]}
					onPress={() => onSelect(color)}
					activeOpacity={0.7}
				>
					{selectedColor?.toLowerCase() === color.toLowerCase() && (
						<Ionicons name="checkmark" size={22} color="#ffffff" />
					)}
				</TouchableOpacity>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		padding: 12,
		justifyContent: 'center',
	},
	swatch: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
	},
	swatchSelected: {
		borderWidth: 3,
		borderColor: '#ffffff',
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 4,
	},
});

export default MyColorPicker;
