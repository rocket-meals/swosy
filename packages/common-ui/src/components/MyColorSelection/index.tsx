import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import SettingsListGroupTitle from '../SettingsListGroupTitle';
import SettingsListSelectOptionSingle from '../SettingsListSelectOptionSingle';
import MyColorPicker, { PRESET_COLORS } from '../MyColorPicker';
import MyCustomColorPicker from '../MyCustomColorPicker';

/**
 * MyColorSelection — modal content for picking a color: a free color picker (surface, hue
 * slider, hex input) with a "use this color" row, followed by a grid of preset colors.
 *
 * It is the generic form of the avatar editor's color modal and meant to be shown inside
 * `useMyScrollViewModal().show({ children })`. `SettingsListColor` uses it; screens with
 * their own trigger (e.g. a swatch row with an edit button) can show it directly.
 */

export interface MyColorSelectionTexts {
	customColorTitle: string;
	useCustomColor: string;
	presetsTitle: string;
}

export const MY_COLOR_SELECTION_FALLBACK_TEXTS: MyColorSelectionTexts = {
	customColorTitle: 'Custom color',
	useCustomColor: 'Use this color',
	presetsTitle: 'Presets',
};

export type MyColorSelectionProps = {
	/** Currently selected color as '#rrggbb'. */
	selectedColor?: string | null;
	/** Called once the user commits to a color (preset tap or "use this color"). */
	onSelect: (color: string) => void;
	/** Preset swatches. Defaults to {@link PRESET_COLORS}. */
	presetColors?: string[];
	selectionColor?: string;
	texts?: MyColorSelectionTexts;
};

const MyColorSelection: React.FC<MyColorSelectionProps> = ({ selectedColor, onSelect, presetColors = PRESET_COLORS, selectionColor, texts = MY_COLOR_SELECTION_FALLBACK_TEXTS }) => {
	const { theme, isDark } = useTheme();
	const [customColor, setCustomColor] = useState<string | null>(selectedColor ?? null);
	const isCustomSelected = !!customColor && selectedColor?.toLowerCase() === customColor.toLowerCase();

	return (
		<View style={styles.container}>
			<SettingsListGroupTitle title={texts.customColorTitle} />
			<MyCustomColorPicker color={customColor ?? undefined} onColorChange={setCustomColor} />
			{customColor ? <SettingsListSelectOptionSingle label={texts.useCustomColor} selectionColor={selectionColor} isSelected={isCustomSelected} groupPosition="single" showSeparator={false} onPress={() => onSelect(customColor)} extraRightContent={<View style={[styles.swatch, { backgroundColor: customColor, borderColor: myContrastColor(customColor, theme, isDark) }]} />} /> : null}
			<SettingsListGroupTitle title={texts.presetsTitle} />
			<MyColorPicker colors={presetColors} selectedColor={selectedColor ?? null} onSelect={onSelect} />
		</View>
	);
};

export default MyColorSelection;

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	swatch: {
		width: 32,
		height: 32,
		borderRadius: 16,
		borderWidth: 1,
		marginRight: 8,
	},
});
