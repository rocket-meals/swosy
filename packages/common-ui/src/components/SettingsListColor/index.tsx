import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import SettingsList from '../SettingsList';
import PrintHidden from '../PrintHidden';
import type { SettingsListProps } from '../SettingsList/types';
import MyColorSelection, { MY_COLOR_SELECTION_FALLBACK_TEXTS } from '../MyColorSelection';
import type { MyColorSelectionTexts } from '../MyColorSelection';

export type SettingsListColorProps = Omit<SettingsListProps, 'value' | 'handleFunction' | 'onPress' | 'rightIcon' | 'rightElement'> & {
	/** Current color as '#rrggbb'; empty/undefined shows an empty swatch. */
	value?: string | null;
	onChange: (color: string) => void;
	/** Preset swatches shown in the selection modal. */
	presetColors?: string[];
	/** Title of the selection modal. Defaults to the row's title/label. */
	modalTitle?: string;
	editable?: boolean;
	texts?: MyColorSelectionTexts;
};

/**
 * Settings row showing a color swatch; tapping it opens {@link MyColorSelection} in the
 * scroll-view modal.
 */
const SettingsListColor: React.FC<SettingsListColorProps> = ({ value, onChange, presetColors, modalTitle, editable = true, texts = MY_COLOR_SELECTION_FALLBACK_TEXTS, primaryColor, ...settingsListProps }) => {
	const { theme, isDark } = useTheme();
	const settingsCtx = useSettingsContext();
	const { show, close } = useMyScrollViewModal();
	const resolvedPrimaryColor = primaryColor ?? settingsCtx?.primaryColor ?? theme.primary;

	const openSelection = useCallback(() => {
		if (!editable) return;
		show({
			title: modalTitle ?? settingsListProps.title ?? settingsListProps.label,
			onClose: close,
			children: (
				<MyColorSelection
					selectedColor={value}
					presetColors={presetColors}
					selectionColor={resolvedPrimaryColor}
					texts={texts}
					onSelect={color => {
						onChange(color);
						close();
					}}
				/>
			),
		});
	}, [close, editable, modalTitle, onChange, presetColors, resolvedPrimaryColor, settingsListProps.label, settingsListProps.title, show, texts, value]);

	const swatch = (
		<View style={styles.right}>
			<View
				style={[
					styles.swatch,
					{
						backgroundColor: value || 'transparent',
						borderColor: value ? myContrastColor(value, theme, isDark) : theme.screen.icon,
					},
				]}
			/>
			{editable ? (
				<PrintHidden>
					<MaterialCommunityIcons name="pencil" size={22} color={theme.screen.icon} />
				</PrintHidden>
			) : null}
		</View>
	);

	return <SettingsList {...settingsListProps} primaryColor={resolvedPrimaryColor} rightElement={swatch} onPress={editable ? openSelection : undefined} />;
};

export default SettingsListColor;

const styles = StyleSheet.create({
	right: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	swatch: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 1,
	},
});
