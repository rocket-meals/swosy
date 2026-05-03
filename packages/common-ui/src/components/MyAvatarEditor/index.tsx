import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MyAvatar, { AvatarStyle, AvatarSize, STYLE_MAP } from '../MyAvatar';
import { Style } from '@dicebear/core';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import SettingsListGroupTitle from '../SettingsListGroupTitle';
import SettingsList from '../SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HAIR_COLORS, SKIN_COLORS, PRESET_COLORS } from '../MyColorPicker';
import { myContrastColor } from '../../helpers/ColorHelper';
import { useTheme } from '../../context/ThemeContext';
import SettingsListSelectOptionSingle from '../SettingsListSelectOptionSingle/SettingsListSelectOptionSingle';

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

/**
 * Per-style attribute order for a character-creation-style flow.
 * Each style defines its own logical order: skin/base first, then facial
 * features (each component paired with its matching color), then clothing
 * and accessories.
 * Keys not listed here are appended after the known keys in their original order.
 */
const ATTRIBUTE_ORDER_BY_STYLE: Partial<Record<AvatarStyle, string[]>> = {
	[AvatarStyle.ADVENTURER]: [
		'skinColor', 'hair', 'hairColor', 'eyebrows', 'eyes', 'mouth', 'features', 'earrings', 'glasses',
	],
	[AvatarStyle.ADVENTURER_NEUTRAL]: [
		'eyebrows', 'eyes', 'mouth', 'glasses', 'backgroundColor',
	],
	[AvatarStyle.AVATAAARS]: [
		'skinColor', 'hair', 'hairColor', 'eyebrows', 'eyes', 'mouth', 'nose', 'facialHair', 'facialHairColor',
		'clothing', 'clothesColor', 'clothingGraphic', 'top', 'hatColor', 'accessories', 'accessoriesColor',
		'style', 'backgroundColor',
	],
	[AvatarStyle.AVATAAARS_NEUTRAL]: [
		'eyebrows', 'eyes', 'mouth', 'backgroundColor',
	],
	[AvatarStyle.BIG_EARS]: [
		'skinColor', 'face', 'hair', 'hairColor', 'frontHair', 'ear', 'sideburn', 'cheek',
		'eyes', 'mouth', 'nose',
	],
	[AvatarStyle.BIG_EARS_NEUTRAL]: [
		'cheek', 'eyes', 'mouth', 'nose', 'backgroundColor',
	],
	[AvatarStyle.BIG_SMILE]: [
		'skinColor', 'hair', 'hairColor', 'eyes', 'mouth', 'accessories',
	],
	[AvatarStyle.BOTTTS]: [
		'baseColor', 'face', 'eyes', 'mouth', 'sides', 'texture', 'top',
	],
	[AvatarStyle.BOTTTS_NEUTRAL]: [
		'eyes', 'mouth', 'backgroundColor',
	],
	[AvatarStyle.CROODLES]: [
		'baseColor', 'face', 'eyes', 'mouth', 'nose', 'beard', 'mustache', 'top', 'topColor',
	],
	[AvatarStyle.CROODLES_NEUTRAL]: [
		'eyes', 'mouth', 'nose',
	],
	[AvatarStyle.DYLAN]: [
		'skinColor', 'hair', 'hairColor', 'mood', 'facialHair', 'backgroundColor',
	],
	[AvatarStyle.FUN_EMOJI]: [
		'eyes', 'mouth', 'backgroundColor',
	],
	[AvatarStyle.LORELEI]: [
		'skinColor', 'head', 'hair', 'hairColor', 'eyebrows', 'eyebrowsColor', 'eyes', 'eyesColor',
		'mouth', 'mouthColor', 'nose', 'noseColor', 'frecklesColor', 'beard',
		'earrings', 'earringsColor', 'glasses', 'glassesColor', 'hairAccessoriesColor',
	],
	[AvatarStyle.LORELEI_NEUTRAL]: [
		'eyebrows', 'eyebrowsColor', 'eyes', 'eyesColor', 'mouth', 'mouthColor',
		'nose', 'noseColor', 'frecklesColor', 'glasses', 'glassesColor', 'backgroundColor',
	],
	[AvatarStyle.MICAH]: [
		'baseColor', 'hair', 'hairColor', 'eyebrows', 'eyebrowsColor', 'eyes', 'eyesColor',
		'eyeShadowColor', 'mouth', 'mouthColor', 'nose', 'ears', 'facialHair', 'facialHairColor',
		'earrings', 'earringColor', 'glasses', 'glassesColor', 'shirt', 'shirtColor',
	],
	[AvatarStyle.MINIAVS]: [
		'skinColor', 'head', 'hair', 'hairColor', 'eyes', 'mouth', 'mustache',
		'body', 'bodyColor',
	],
	[AvatarStyle.NOTIONISTS]: [
		'beard', 'hair', 'brows', 'eyes', 'lips', 'nose', 'glasses',
		'body', 'bodyIcon', 'gesture',
	],
	[AvatarStyle.NOTIONISTS_NEUTRAL]: [
		'brows', 'eyes', 'lips', 'nose', 'glasses', 'backgroundColor',
	],
	[AvatarStyle.OPEN_PEEPS]: [
		'skinColor', 'head', 'headContrastColor', 'face', 'facialHair',
		'accessories', 'mask', 'clothingColor',
	],
	[AvatarStyle.PERSONAS]: [
		'skinColor', 'hair', 'hairColor', 'eyes', 'mouth', 'nose',
		'facialHair', 'body', 'clothingColor',
	],
	[AvatarStyle.PIXEL_ART]: [
		'skinColor', 'hair', 'hairColor', 'eyesColor', 'eyes', 'mouth', 'mouthColor',
		'beard', 'glasses', 'glassesColor', 'hat', 'hatColor',
		'clothing', 'clothingColor', 'accessories', 'accessoriesColor',
	],
	[AvatarStyle.PIXEL_ART_NEUTRAL]: [
		'eyes', 'eyesColor', 'mouth', 'mouthColor', 'glasses', 'glassesColor', 'backgroundColor',
	],
	[AvatarStyle.THUMBS]: [
		'face', 'eyes', 'eyesColor', 'mouth', 'mouthColor', 'shapeColor', 'backgroundColor',
	],
	[AvatarStyle.TOON_HEAD]: [
		'skinColor', 'head', 'hair', 'hairColor', 'rearHair', 'eyebrows', 'eyes', 'mouth',
		'beard', 'clothes', 'clothesColor',
	],
};

/**
 * Sorts avatar attribute keys (component + color) in a logical character-creation
 * order based on the current avatar style. Keys with a known position come first
 * (in that order), followed by any remaining keys in their original relative order.
 */
function sortAttributeKeys(keys: string[], style: AvatarStyle): string[] {
	const order = ATTRIBUTE_ORDER_BY_STYLE[style];
	if (!order) return keys;
	const knownSet = new Set(order);
	const knownKeys = order.filter((k) => keys.includes(k));
	const unknownKeys = keys.filter((k) => !knownSet.has(k));
	return [...knownKeys, ...unknownKeys];
}

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
 * Returns the default hex color values (without '#') for a given color property key
 * from the DiceBear avatar style schema.
 */
function getSchemaDefaultColors(style: AvatarStyle, key: string): string[] {
	const dicebearStyle = STYLE_MAP[style] as Style<object> & { schema?: { properties?: Record<string, any> } };
	const prop = dicebearStyle?.schema?.properties?.[key];
	if (prop?.default && Array.isArray(prop.default)) {
		return prop.default as string[];
	}
	return [];
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

/** Size used for avatar previews inside selection modals. */
const PREVIEW_AVATAR_SIZE = 80;

type AvatarEditorModalContentProps = {
	initialConfig: AvatarConfig;
	accentColor?: string;
	configRef: React.MutableRefObject<AvatarConfig>;
};

type ColorPickerModalContentProps = {
	colors: string[];
	initialSelectedColor: string | null;
	onSelectAndClose: (color: string) => void;
	accentColor?: string;
	config: AvatarConfig;
	colorKey: string;
};

const ColorPickerModalContent: React.FC<ColorPickerModalContentProps> = ({
	colors,
	initialSelectedColor,
	onSelectAndClose,
	accentColor,
	config,
	colorKey,
}) => {
	return (
		<>
			{colors.map((color, index) => {
				const groupPosition =
					colors.length === 1
						? 'single'
						: index === 0
							? 'top'
							: index === colors.length - 1
								? 'bottom'
								: 'middle';
				const previewOptions = { ...(config.options ?? {}), [colorKey]: [stripHashPrefix(color)] };
				return (
					<SettingsListSelectOptionSingle
						key={color}
						label={color}
						leftIcon={
							<View style={styles.previewAvatarWrapper}>
								<MyAvatar
									seed={config.seed}
									style={config.style}
									size={PREVIEW_AVATAR_SIZE}
									borderRadius={PREVIEW_AVATAR_SIZE / 2}
									options={previewOptions}
								/>
							</View>
						}
						noIconIndent
						selectionColor={accentColor}
						isSelected={initialSelectedColor?.toLowerCase() === color.toLowerCase()}
						groupPosition={groupPosition}
						showSeparator={index !== colors.length - 1}
						onPress={() => onSelectAndClose(color)}
					/>
				);
			})}
		</>
	);
};

type StylePickerModalContentProps = {
	currentStyle: AvatarStyle;
	seed: string;
	onSelectAndClose: (style: AvatarStyle) => void;
	accentColor?: string;
};

const StylePickerModalContent: React.FC<StylePickerModalContentProps> = ({
	currentStyle,
	seed,
	onSelectAndClose,
	accentColor,
}) => {
	const allStyles = Object.values(AvatarStyle);
	return (
		<>
			{allStyles.map((style, index) => {
				const groupPosition =
					allStyles.length === 1
						? 'single'
						: index === 0
							? 'top'
							: index === allStyles.length - 1
								? 'bottom'
								: 'middle';
				return (
					<SettingsListSelectOptionSingle
						key={style}
						label={style}
						leftIcon={
							<View style={styles.previewAvatarWrapper}>
								<MyAvatar
									seed={seed}
									style={style}
									size={PREVIEW_AVATAR_SIZE}
									borderRadius={PREVIEW_AVATAR_SIZE / 2}
								/>
							</View>
						}
						noIconIndent
						selectionColor={accentColor}
						isSelected={currentStyle === style}
						groupPosition={groupPosition}
						showSeparator={index !== allStyles.length - 1}
						onPress={() => onSelectAndClose(style)}
					/>
				);
			})}
		</>
	);
};

type ComponentPickerModalContentProps = {
	categoryKey: string;
	values: string[];
	currentValue: string | null;
	config: AvatarConfig;
	onSelectAndClose: (value: string) => void;
	accentColor?: string;
};

const ComponentPickerModalContent: React.FC<ComponentPickerModalContentProps> = ({
	categoryKey,
	values,
	currentValue,
	config,
	onSelectAndClose,
	accentColor,
}) => {
	return (
		<>
			{values.map((value, index) => {
				const groupPosition =
					values.length === 1
						? 'single'
						: index === 0
							? 'top'
							: index === values.length - 1
								? 'bottom'
								: 'middle';
				const previewOptions = { ...(config.options ?? {}), [categoryKey]: [value] };
				return (
					<SettingsListSelectOptionSingle
						key={value}
						label={value}
						leftIcon={
							<View style={styles.previewAvatarWrapper}>
								<MyAvatar
									seed={config.seed}
									style={config.style}
									size={PREVIEW_AVATAR_SIZE}
									borderRadius={PREVIEW_AVATAR_SIZE / 2}
									options={previewOptions}
								/>
							</View>
						}
						noIconIndent
						selectionColor={accentColor}
						isSelected={currentValue === value}
						groupPosition={groupPosition}
						showSeparator={index !== values.length - 1}
						onPress={() => onSelectAndClose(value)}
					/>
				);
			})}
		</>
	);
};

const AvatarEditorModalContent: React.FC<AvatarEditorModalContentProps> = ({
	initialConfig,
	accentColor,
	configRef,
}) => {
	const [config, setConfig] = useState<AvatarConfig>(configRef.current);
	const { show: showCategoryModal, close: closeCategoryModal } = useMyScrollViewModal();
	const { theme, isDark } = useTheme();

	const handleChange = (newConfig: AvatarConfig) => {
		setConfig(newConfig);
		configRef.current = newConfig;
	};

	const componentOptions = useMemo(() => getStyleComponentOptions(config.style), [config.style]);
	const componentKeys = useMemo(() => Object.keys(componentOptions), [componentOptions]);
	const colorKeys = useMemo(() => getStyleColorKeys(config.style), [config.style]);

	const handleStyleChange = (newStyle: AvatarStyle) => {
		handleChange({ ...config, style: newStyle, options: undefined });
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
		handleChange({ ...config, options: randomOptions });
	};

	const handleOpenStylePicker = () => {
		showCategoryModal({
			title: BUILTIN_CATEGORY_STYLE,
			children: (
				<StylePickerModalContent
					currentStyle={config.style}
					seed={config.seed}
					accentColor={accentColor}
					onSelectAndClose={(style) => {
						handleStyleChange(style);
						closeCategoryModal();
					}}
				/>
			),
		});
	};

	const handleOpenComponentPicker = (key: string) => {
		const values = componentOptions[key];
		if (!values) return;
		showCategoryModal({
			title: key,
			children: (
				<ComponentPickerModalContent
					categoryKey={key}
					values={values}
					currentValue={getSelectedOptionValue(key)}
					config={config}
					accentColor={accentColor}
					onSelectAndClose={(value) => {
						handleOptionChange(key, value);
						closeCategoryModal();
					}}
				/>
			),
		});
	};

	const handleOpenColorPicker = (key: string) => {
		const presetColors = getPresetColorsForKey(key);
		const storedHex = config.options?.[key]?.[0] ?? null;
		let displayHex = storedHex;
		if (!displayHex) {
			const schemaDefaults = getSchemaDefaultColors(config.style, key);
			if (schemaDefaults.length > 0) {
				displayHex = schemaDefaults[0];
			}
		}
		const selectedColor = displayHex ? '#' + displayHex : null;

		showCategoryModal({
			title: key,
			children: (
				<ColorPickerModalContent
					colors={presetColors}
					initialSelectedColor={selectedColor}
					accentColor={accentColor}
					config={config}
					colorKey={key}
					onSelectAndClose={(color) => {
						handleOptionChange(key, stripHashPrefix(color));
						closeCategoryModal();
					}}
				/>
			),
		});
	};

	/** Get current display value for a category. */
	const getCategoryDisplayValue = (cat: string): string | undefined => {
		if (cat === BUILTIN_CATEGORY_STYLE) return config.style;
		if (colorKeys.includes(cat)) {
			const hex = config.options?.[cat]?.[0];
			return hex ? '#' + hex : undefined;
		}
		return getSelectedOptionValue(cat) ?? undefined;
	};

	/** Get the handler for opening a category's selection modal. */
	const getCategoryHandler = (cat: string): (() => void) => {
		if (cat === BUILTIN_CATEGORY_STYLE) return handleOpenStylePicker;
		if (colorKeys.includes(cat)) return () => handleOpenColorPicker(cat);
		return () => handleOpenComponentPicker(cat);
	};

	const sortedAttributeKeys = useMemo(
		() => sortAttributeKeys([...componentKeys, ...colorKeys], config.style),
		[componentKeys, colorKeys, config.style],
	);
	const allCategories = [BUILTIN_CATEGORY_STYLE, ...sortedAttributeKeys];

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
				<TouchableOpacity style={styles.diceButton} onPress={handleRandomize} accessibilityLabel="Randomize avatar" accessibilityRole="button">
					<MaterialCommunityIcons name="dice-multiple" size={24} color={accentColor ?? '#fff'} />
				</TouchableOpacity>
			</View>

			<SettingsListGroupTitle title="Category" />
			{allCategories.map((cat, index) => {
				const groupPosition =
					allCategories.length === 1
						? 'single'
						: index === 0
							? 'top'
							: index === allCategories.length - 1
								? 'bottom'
								: 'middle';
				const displayValue = getCategoryDisplayValue(cat);
				const colorKey = colorKeys.includes(cat) ? config.options?.[cat]?.[0] : null;
				const swatchColor = colorKey ? '#' + colorKey : undefined;
				const swatchBorderColor = swatchColor ? myContrastColor(swatchColor, theme, isDark) : undefined;

				return (
					<SettingsList
						key={cat}
						title={cat}
						value={displayValue}
						onPress={getCategoryHandler(cat)}
						iconBgColor={accentColor}
						groupPosition={groupPosition}
						showSeparator={index !== allCategories.length - 1}
						rightElement={
							swatchColor ? (
								<View
									style={[
										styles.colorSwatch,
										{ backgroundColor: swatchColor, borderColor: swatchBorderColor },
									]}
								/>
							) : undefined
						}
					/>
				);
			})}
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
		position: 'relative',
	},
	diceButton: {
		position: 'absolute',
		top: 24,
		right: 0,
		padding: 6,
	},
	colorSwatch: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1.5,
	},
	previewAvatarWrapper: {
		marginRight: 10,
	},
});
