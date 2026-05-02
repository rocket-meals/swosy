import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MyAvatar, { AvatarStyle, AvatarSize, STYLE_MAP } from '../MyAvatar';
import { Style } from '@dicebear/core';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import SettingsListLeftRight from '../SettingsListLeftRight';
import SettingsListGroupTitle from '../SettingsListGroupTitle';
import SettingsList from '../SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MyColorPicker, { HAIR_COLORS, SKIN_COLORS, PRESET_COLORS } from '../MyColorPicker';

export type AvatarConfig = {
	seed: string;
	style: AvatarStyle;
	size: AvatarSize;
	/** Style-specific options like eyes, mouth, hair, etc. Each key maps to a single-element array. */
	options?: Record<string, string[]>;
};

const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
	seed: 'John Doe',
	style: AvatarStyle.LORELEI,
	size: AvatarSize.LARGE,
};

/** Built-in category keys (always available regardless of style). */
const BUILTIN_CATEGORY_STYLE = 'Style';
const BUILTIN_CATEGORIES = [BUILTIN_CATEGORY_STYLE];

const AVATAR_STYLE_OPTIONS = Object.values(AvatarStyle).map((style) => ({
	id: style,
	label: style,
}));

/**
 * Returns the available component options (e.g. eyes, mouth, hair) for a given
 * DiceBear avatar style. Each key maps to its allowed enum values.
 */
function getStyleComponentOptions(style: AvatarStyle): Record<string, string[]> {
	const dicebearStyle = STYLE_MAP[style] as Style<object> & { schema?: { properties?: Record<string, any> } };
	const properties = dicebearStyle?.schema?.properties;
	if (!properties) return {};

	const result: Record<string, string[]> = {};
	for (const [key, value] of Object.entries(properties)) {
		if (key.endsWith('Color') || key.includes('Probability')) continue;
		const items = (value as any)?.items;
		if (items?.enum && Array.isArray(items.enum) && items.enum.length > 1) {
			result[key] = items.enum as string[];
		}
	}
	return result;
}

/**
 * Returns the color property keys (e.g. hairColor, skinColor) for a given
 * DiceBear avatar style.
 */
function getStyleColorKeys(style: AvatarStyle): string[] {
	const dicebearStyle = STYLE_MAP[style] as Style<object> & { schema?: { properties?: Record<string, any> } };
	const properties = dicebearStyle?.schema?.properties;
	if (!properties) return [];
	return Object.keys(properties).filter((key) => key.endsWith('Color'));
}

/**
 * Returns the predefined color palette appropriate for a given color property key.
 */
function getPresetColorsForKey(key: string): string[] {
	const lower = key.toLowerCase();
	if (lower.includes('skin')) return SKIN_COLORS;
	if (lower.includes('hair')) return HAIR_COLORS;
	return PRESET_COLORS;
}

/** Strips the leading '#' from a hex color string if present. */
function stripHashPrefix(color: string): string {
	return color.startsWith('#') ? color.slice(1) : color;
}

type AvatarEditorModalContentProps = {
	initialConfig: AvatarConfig;
	accentColor?: string;
	configRef: React.MutableRefObject<AvatarConfig>;
};

type ColorPickerModalContentProps = {
	colors: string[];
	initialSelectedColor: string | null;
	onSelect: (color: string) => void;
};

const ColorPickerModalContent: React.FC<ColorPickerModalContentProps> = ({
	colors,
	initialSelectedColor,
	onSelect,
}) => {
	const [selectedColor, setSelectedColor] = useState<string | null>(initialSelectedColor);
	return (
		<MyColorPicker
			colors={colors}
			selectedColor={selectedColor}
			onSelect={(color) => {
				setSelectedColor(color);
				onSelect(color);
			}}
		/>
	);
};

const AvatarEditorModalContent: React.FC<AvatarEditorModalContentProps> = ({
	initialConfig,
	accentColor,
	configRef,
}) => {
	const [config, setConfig] = useState<AvatarConfig>(initialConfig);
	const [selectedCategory, setSelectedCategory] = useState<string>(BUILTIN_CATEGORY_STYLE);
	const { show: showColorModal } = useMyScrollViewModal();

	const handleChange = (newConfig: AvatarConfig) => {
		setConfig(newConfig);
		configRef.current = newConfig;
	};

	const componentOptions = useMemo(() => getStyleComponentOptions(config.style), [config.style]);
	const componentKeys = useMemo(() => Object.keys(componentOptions), [componentOptions]);
	const colorKeys = useMemo(() => getStyleColorKeys(config.style), [config.style]);

	/** All available categories: built-in ones + style-specific component keys + color keys. */
	const allCategories = useMemo(() => {
		return [...BUILTIN_CATEGORIES, ...componentKeys, ...colorKeys];
	}, [componentKeys, colorKeys]);

	const categoryOptions = useMemo(() => {
		return allCategories.map((cat) => ({ id: cat, label: cat }));
	}, [allCategories]);

	/** When the style changes, component keys may change – reset category if it no longer exists. */
	const handleStyleChange = (newStyle: AvatarStyle) => {
		handleChange({ ...config, style: newStyle, options: undefined });
		// If the currently selected category is a component/color key that doesn't exist in the new style, reset to Style
		const newComponentKeys = Object.keys(getStyleComponentOptions(newStyle));
		const newColorKeys = getStyleColorKeys(newStyle);
		const allNew = [...BUILTIN_CATEGORIES, ...newComponentKeys, ...newColorKeys];
		if (!allNew.includes(selectedCategory)) {
			setSelectedCategory(BUILTIN_CATEGORY_STYLE);
		}
	};

	const handleOptionChange = (key: string, value: string) => {
		const newOptions = { ...(config.options ?? {}), [key]: [value] };
		handleChange({ ...config, options: newOptions });
	};

	const getSelectedOptionValue = (key: string): string | null => {
		const selected = config.options?.[key];
		if (selected && selected.length > 0) return selected[0];
		return null;
	};

	const handleRandomize = () => {
		const newComponentOptions = getStyleComponentOptions(config.style);
		const newColorKeys = getStyleColorKeys(config.style);
		const randomOptions: Record<string, string[]> = {};
		for (const [key, values] of Object.entries(newComponentOptions)) {
			randomOptions[key] = [values[Math.floor(Math.random() * values.length)]];
		}
		for (const key of newColorKeys) {
			const presetColors = getPresetColorsForKey(key);
			const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];
			randomOptions[key] = [stripHashPrefix(randomColor)];
		}
		const newConfig: AvatarConfig = {
			...config,
			options: randomOptions,
		};
		handleChange(newConfig);
	};

	/** Render the value selector for the currently active category. */
	const renderValueSelector = () => {
		if (selectedCategory === BUILTIN_CATEGORY_STYLE) {
			return (
				<SettingsListLeftRight
					label="Style"
					options={AVATAR_STYLE_OPTIONS}
					selectedOption={config.style}
					onSelect={(option) => handleStyleChange(option.id as AvatarStyle)}
					iconBgColor={accentColor}
					accentColor={accentColor}
					groupPosition="single"
				/>
			);
		}

		// Color option (hairColor, skinColor, etc.)
		if (colorKeys.includes(selectedCategory)) {
			const presetColors = getPresetColorsForKey(selectedCategory);
			const storedHex = config.options?.[selectedCategory]?.[0] ?? null;
			const selectedColor = storedHex ? '#' + storedHex : null;
			const colorOptions = presetColors.map((color) => ({ id: color, label: color }));

			const handleColorSelect = (color: string) => {
				handleOptionChange(selectedCategory, stripHashPrefix(color));
			};

			const handleOpenColorPicker = () => {
				showColorModal({
					title: selectedCategory,
					children: (
						<ColorPickerModalContent
							colors={presetColors}
							initialSelectedColor={selectedColor}
							onSelect={handleColorSelect}
						/>
					),
				});
			};

			return (
				<SettingsListLeftRight
					label={selectedCategory}
					options={colorOptions}
					selectedOption={selectedColor}
					onSelect={(option) => handleColorSelect(option.id)}
					iconBgColor={selectedColor ?? undefined}
					onPress={handleOpenColorPicker}
					accentColor={accentColor}
					groupPosition="single"
				/>
			);
		}

		// Component option (eyes, mouth, hair, etc.)
		const values = componentOptions[selectedCategory];
		if (!values) return null;
		const optionItems = values.map((v) => ({ id: v, label: v }));
		const selectedValue = getSelectedOptionValue(selectedCategory);

		return (
			<SettingsListLeftRight
				label={selectedCategory}
				options={optionItems}
				selectedOption={selectedValue}
				onSelect={(option) => handleOptionChange(selectedCategory, option.id as string)}
				iconBgColor={accentColor}
				accentColor={accentColor}
				groupPosition="single"
			/>
		);
	};

	return (
		<View style={styles.content}>
			<View style={styles.avatarContainer}>
				<MyAvatar
					seed={config.seed}
					style={config.style}
					size={AvatarSize.XLARGE}
					borderRadius={AvatarSize.XLARGE / 2}
					options={config.options}
				/>
			</View>

			<SettingsListGroupTitle title="Category" />
			<SettingsListLeftRight
				label="Select Category"
				options={categoryOptions}
				selectedOption={selectedCategory}
				onSelect={(option) => setSelectedCategory(option.id)}
				iconBgColor={accentColor}
				accentColor={accentColor}
				groupPosition="single"
			/>

			<SettingsListGroupTitle title={selectedCategory} />
			{renderValueSelector()}

			<SettingsListGroupTitle title="Randomize" />
			<SettingsList
				title="Generate Random Avatar"
				onPress={handleRandomize}
				leftIcon={<MaterialCommunityIcons name="dice-multiple" size={20} color={accentColor ?? 'transparent'} />}
				iconBgColor={accentColor}
				groupPosition="single"
			/>
		</View>
	);
};

export type UseAvatarEditorModalOptions = {
	title?: string;
	accentColor?: string;
};

export const useAvatarEditorModal = () => {
	const { show, close } = useMyScrollViewModal();
	const configRef = useRef<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

	const showAvatarEditor = useCallback(
		(initialConfig: AvatarConfig, onClose: (config: AvatarConfig) => void, options?: UseAvatarEditorModalOptions) => {
			configRef.current = { ...initialConfig };

			show({
				title: options?.title ?? 'Avatar Editor',
				onClose: () => {
					onClose(configRef.current);
				},
				children: (
					<AvatarEditorModalContent
						initialConfig={initialConfig}
						accentColor={options?.accentColor}
						configRef={configRef}
					/>
				),
			});
		},
		[show],
	);

	return { showAvatarEditor, close };
};

const styles = StyleSheet.create({
	content: {
		width: '100%',
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 24,
	},
});
