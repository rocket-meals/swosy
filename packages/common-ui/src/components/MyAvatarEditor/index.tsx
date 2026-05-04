import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import MyAvatar, { AvatarStyle, AvatarSize, STYLE_MAP, AvatarConfig } from '../MyAvatar';
import { Style } from '@dicebear/core';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import SettingsListGroupTitle from '../SettingsListGroupTitle';
import SettingsList from '../SettingsList';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HAIR_COLORS, SKIN_COLORS, PRESET_COLORS } from '../MyColorPicker';
import { myContrastColor } from '../../helpers/ColorHelper';
import { useTheme } from '../../context/ThemeContext';
import SettingsListSelectOptionSingle from '../SettingsListSelectOptionSingle/SettingsListSelectOptionSingle';

export type { AvatarConfig } from '../MyAvatar';

const DEFAULT_AVATAR_STYLE = AvatarStyle.LORELEI;

const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
	style: DEFAULT_AVATAR_STYLE,
	size: AvatarSize.LARGE,
	options: getDefaultOptionsForStyle(DEFAULT_AVATAR_STYLE),
};

/** Built-in category keys (always available regardless of style). */
const BUILTIN_CATEGORY_STYLE = 'Style';

/**
 * Maps avatar attribute category keys to MaterialCommunityIcons icon names.
 * Used to display a recognisable icon on the left side of each settings-list row.
 */
const CATEGORY_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
	// Built-in
	[BUILTIN_CATEGORY_STYLE]: 'palette-swatch-variant',
	// Skin / base
	skinColor: 'hand-back-right',
	baseColor: 'circle',
	// Hair
	hair: 'face-woman-shimmer',
	hairColor: 'palette',
	frontHair: 'face-woman-shimmer',
	rearHair: 'hair-dryer',
	sideburn: 'face-man-profile',
	// Face
	face: 'emoticon-outline',
	head: 'head',
	// Eyebrows
	eyebrows: 'emoticon-angry-outline',
	eyebrowsColor: 'palette',
	brows: 'emoticon-angry-outline',
	// Eyes
	eyes: 'eye',
	eyesColor: 'eye',
	eyeShadowColor: 'eye-circle',
	// Nose
	nose: 'triangle-outline',
	noseColor: 'triangle-outline',
	// Mouth / lips
	mouth: 'emoticon-kiss-outline',
	mouthColor: 'emoticon-kiss-outline',
	lips: 'emoticon-kiss-outline',
	// Beard / facial hair
	beard: 'face-man',
	facialHair: 'face-man',
	facialHairColor: 'face-man',
	mustache: 'mustache',
	// Ears / earrings
	ear: 'ear-hearing',
	ears: 'ear-hearing',
	earrings: 'diamond-stone',
	earringsColor: 'diamond-stone',
	earringColor: 'diamond-stone',
	// Glasses
	glasses: 'glasses',
	glassesColor: 'glasses',
	// Accessories / features
	accessories: 'necklace',
	accessoriesColor: 'necklace',
	features: 'star-outline',
	hairAccessoriesColor: 'bow-tie',
	frecklesColor: 'dots-circle',
	cheek: 'emoticon-happy-outline',
	// Clothing / body
	clothing: 'tshirt-crew',
	clothesColor: 'tshirt-crew',
	clothingColor: 'tshirt-crew',
	clothingGraphic: 'image-outline',
	clothes: 'tshirt-crew',
	body: 'human',
	bodyColor: 'human',
	bodyIcon: 'image-outline',
	shirt: 'tshirt-crew',
	shirtColor: 'tshirt-crew',
	// Hat / top
	top: 'hat-fedora',
	topColor: 'hat-fedora',
	hat: 'hat-fedora',
	hatColor: 'hat-fedora',
	hairAccessories: 'bow-tie',
	// Misc
	mask: 'face-mask',
	headContrastColor: 'contrast-circle',
	sides: 'robot',
	texture: 'texture',
	shapeColor: 'shape',
	backgroundColor: 'format-color-fill',
	gesture: 'hand-wave',
	mood: 'emoticon-outline',
	style: 'cog-outline',
};

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
 * Returns a default set of component options for the given avatar style.
 * For each component attribute, the value "default" is used when it exists
 * in the allowed enum values, otherwise the first available value is used.
 * For color attributes, the schema default is used if available, otherwise
 * the first preset color for that category is used.
 */
function getDefaultOptionsForStyle(style: AvatarStyle): Record<string, string[]> {
	const componentOptions = getStyleComponentOptions(style);
	const probabilityKeys = getStyleProbabilityKeys(style);
	const defaults: Record<string, string[]> = {};
	for (const [key, values] of Object.entries(componentOptions)) {
		const realValues = values.filter((v) => v !== NONE_OPTION);
		if (realValues.includes('default')) {
			defaults[key] = ['default'];
		} else if (realValues.length > 0) {
			defaults[key] = [realValues[0]];
		}
		// Set probability to 100 for the default selection so the component is visible
		if (probabilityKeys[key]) {
			defaults[probabilityKeys[key]] = ['100'];
		}
	}
	const colorKeys = getStyleColorKeys(style);
	for (const key of colorKeys) {
		const schemaDefaults = getSchemaDefaultColors(style, key);
		if (schemaDefaults.length > 0) {
			defaults[key] = [stripHashPrefix(schemaDefaults[0])];
		} else {
			const presetColors = getPresetColorsForKey(key);
			if (presetColors.length > 0) {
				defaults[key] = [stripHashPrefix(presetColors[0])];
			}
		}
	}
	return defaults;
}

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

/** Sentinel value used to represent the "none" / disabled option for optional components. */
const NONE_OPTION = '__none__';

/**
 * Returns a map of component keys to their corresponding probability property keys
 * for a given DiceBear avatar style. For example, { glasses: 'glassesProbability' }.
 */
function getStyleProbabilityKeys(style: AvatarStyle): Record<string, string> {
	const dicebearStyle = STYLE_MAP[style] as Style<object> & { schema?: { properties?: Record<string, any> } };
	const properties = dicebearStyle?.schema?.properties;
	if (!properties) return {};

	const result: Record<string, string> = {};
	for (const key of Object.keys(properties)) {
		if (key.endsWith('Probability')) {
			const componentKey = key.replace('Probability', '');
			if (properties[componentKey]) {
				result[componentKey] = key;
			}
		}
	}
	return result;
}

/**
 * Returns the available component options (e.g. eyes, mouth, hair) for a given
 * DiceBear avatar style. Each key maps to its allowed enum values.
 * For components that have an associated probability property, a "none" option
 * is prepended so the user can disable the component.
 */
function getStyleComponentOptions(style: AvatarStyle): Record<string, string[]> {
	const dicebearStyle = STYLE_MAP[style] as Style<object> & { schema?: { properties?: Record<string, any> } };
	const properties = dicebearStyle?.schema?.properties;
	if (!properties) return {};

	const probabilityKeys = getStyleProbabilityKeys(style);
	const result: Record<string, string[]> = {};
	for (const [key, value] of Object.entries(properties)) {
		if (key.endsWith('Color') || key.includes('Probability')) continue;
		const items = (value as any)?.items;
		if (items?.enum && Array.isArray(items.enum) && items.enum.length > 1) {
			const options = items.enum as string[];
			if (probabilityKeys[key]) {
				result[key] = [NONE_OPTION, ...options];
			} else {
				result[key] = options;
			}
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
	if (lower.includes('skin') || lower === 'basecolor') return SKIN_COLORS;
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
	debugMode?: boolean;
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
	onSelectAndClose: (style: AvatarStyle) => void;
	accentColor?: string;
};

const StylePickerModalContent: React.FC<StylePickerModalContentProps> = ({
	currentStyle,
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
	const probKey = getStyleProbabilityKeys(config.style)[categoryKey];
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
				const isNone = value === NONE_OPTION;
				const previewOptions = { ...(config.options ?? {}) };
				if (isNone) {
					if (probKey) {
						previewOptions[probKey] = ['0'];
					}
				} else {
					previewOptions[categoryKey] = [value];
					if (probKey) {
						previewOptions[probKey] = ['100'];
					}
				}
				return (
					<SettingsListSelectOptionSingle
						key={value}
						label={isNone ? 'None' : value}
						leftIcon={
							<View style={styles.previewAvatarWrapper}>
								<MyAvatar
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

type DebugJsonInputProps = {
	config: AvatarConfig;
	onApply: (config: AvatarConfig) => void;
	accentColor?: string;
	theme: any;
};

const DebugJsonInput: React.FC<DebugJsonInputProps> = ({ config, onApply, accentColor, theme }) => {
	const [jsonText, setJsonText] = useState<string>(JSON.stringify(config, null, 2));
	const [error, setError] = useState<string | null>(null);

	// Keep the text input in sync when config changes externally
	React.useEffect(() => {
		setJsonText(JSON.stringify(config, null, 2));
	}, [config]);

	const handleShow = () => {
		try {
			const parsed = JSON.parse(jsonText);
			if (!parsed || typeof parsed !== 'object') {
				setError('JSON must be an object.');
				return;
			}
			if (!parsed.style || !STYLE_MAP[parsed.style as AvatarStyle]) {
				setError('Invalid or missing "style". Must be a valid AvatarStyle.');
				return;
			}
			if (!parsed.size || typeof parsed.size !== 'number') {
				setError('Invalid or missing "size". Must be a number.');
				return;
			}
			setError(null);
			onApply(parsed as AvatarConfig);
		} catch (e) {
			setError('Invalid JSON: ' + (e instanceof Error ? e.message : String(e)));
		}
	};

	return (
		<>
			<SettingsListGroupTitle title="Debug" />
			<Text style={[styles.debugJson, { color: theme.screen.text }]}>
				{JSON.stringify(config, null, 2)}
			</Text>
			<TextInput
				style={[styles.debugJsonInput, { color: theme.screen.text, borderColor: theme.screen.text + '33' }]}
				multiline
				value={jsonText}
				onChangeText={(text) => {
					setJsonText(text);
					setError(null);
				}}
				placeholder="Paste JSON config here..."
				placeholderTextColor={theme.screen.text + '66'}
			/>
			{error && <Text style={styles.debugJsonError}>{error}</Text>}
			<TouchableOpacity
				style={[styles.debugShowButton, { backgroundColor: accentColor ?? theme.screen.text }]}
				onPress={handleShow}
			>
				<Text style={[styles.debugShowButtonText, { color: myContrastColor(accentColor ?? theme.screen.text, theme, false) }]}>
					Show
				</Text>
			</TouchableOpacity>
		</>
	);
};

const AvatarEditorModalContent: React.FC<AvatarEditorModalContentProps> = ({
	initialConfig,
	accentColor,
	configRef,
	debugMode,
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
		handleChange({ ...config, style: newStyle, options: getDefaultOptionsForStyle(newStyle) });
	};

	const probabilityKeys = useMemo(() => getStyleProbabilityKeys(config.style), [config.style]);

	const handleOptionChange = (key: string, value: string) => {
		const newOptions = { ...(config.options ?? {}) };
		const probKey = probabilityKeys[key];
		if (value === NONE_OPTION) {
			// Disable the component via probability
			if (probKey) {
				newOptions[probKey] = ['0'];
			}
			delete newOptions[key];
		} else {
			newOptions[key] = [value];
			// Ensure the component is visible by setting probability to 100
			if (probKey) {
				newOptions[probKey] = ['100'];
			}
		}
		handleChange({ ...config, options: newOptions });
	};

	const getSelectedOptionValue = (key: string): string | null => {
		// If probability is 0, the component is disabled
		const probKey = probabilityKeys[key];
		if (probKey) {
			const prob = config.options?.[probKey];
			if (prob && prob[0] === '0') return NONE_OPTION;
		}
		const selected = config.options?.[key];
		if (selected && selected.length > 0) return selected[0];
		return null;
	};

	const handleRandomize = () => {
		const newComponentOptions = getStyleComponentOptions(config.style);
		const newColorKeys = getStyleColorKeys(config.style);
		const newProbabilityKeys = getStyleProbabilityKeys(config.style);
		const randomOptions: Record<string, string[]> = {};
		for (const [key, values] of Object.entries(newComponentOptions)) {
			const realValues = values.filter((v) => v !== NONE_OPTION);
			if (realValues.length === 0) continue;
			randomOptions[key] = [realValues[Math.floor(Math.random() * realValues.length)]];
			// Set probability to 100 so random selections are always visible
			if (newProbabilityKeys[key]) {
				randomOptions[newProbabilityKeys[key]] = ['100'];
			}
		}
		for (const key of newColorKeys) {
			const presetColors = getPresetColorsForKey(key);
			const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];
			randomOptions[key] = [stripHashPrefix(randomColor)];
		}
		handleChange({ ...config, options: randomOptions });
	};

	const handleCopyConfig = async () => {
		await Clipboard.setStringAsync(JSON.stringify(config, null, 2));
	};

	const handleOpenStylePicker = () => {
		showCategoryModal({
			title: BUILTIN_CATEGORY_STYLE,
			children: (
				<StylePickerModalContent
					currentStyle={config.style}
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
		const val = getSelectedOptionValue(cat);
		if (val === NONE_OPTION) return 'None';
		return val ?? undefined;
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

	const diceButtonBg = accentColor ?? theme.screen.text;
	const diceIconColor = myContrastColor(diceButtonBg, theme, isDark);

	return (
		<View style={styles.content}>
			<View style={styles.avatarContainer}>
				<MyAvatar
					config={{ ...config, size: AvatarSize.XLARGE }}
					borderRadius={AvatarSize.XLARGE / 2}
				/>
				<TouchableOpacity
					style={[styles.diceButton, { backgroundColor: diceButtonBg }]}
					onPress={handleRandomize}
					accessibilityLabel="Randomize avatar"
					accessibilityRole="button"
				>
					<MaterialCommunityIcons name="dice-multiple" size={24} color={diceIconColor} />
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

				const iconName = CATEGORY_ICON_MAP[cat] ?? 'help-circle-outline';

				return (
					<SettingsList
						key={cat}
						title={cat}
						value={displayValue}
						onPress={getCategoryHandler(cat)}
						leftIcon={<MaterialCommunityIcons name={iconName} size={20} />}
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

			<SettingsListGroupTitle title="Actions" />
			<SettingsList
				title="Copy Config"
				onPress={handleCopyConfig}
				leftIcon={<MaterialCommunityIcons name="content-copy" size={20} />}
				iconBgColor={accentColor}
				groupPosition="single"
			/>

			{debugMode && (
				<DebugJsonInput
					config={config}
					onApply={handleChange}
					accentColor={accentColor}
					theme={theme}
				/>
			)}
		</View>
	);
};

export type UseAvatarEditorModalOptions = {
	title?: string;
	accentColor?: string;
	debugMode?: boolean;
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
						debugMode={options?.debugMode}
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
		padding: 8,
		borderRadius: 10,
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
	debugJson: {
		fontFamily: 'monospace',
		fontSize: 12,
		padding: 12,
	},
	debugJsonInput: {
		fontFamily: 'monospace',
		fontSize: 12,
		padding: 12,
		marginHorizontal: 12,
		borderWidth: 1,
		borderRadius: 8,
		minHeight: 120,
		textAlignVertical: 'top',
	},
	debugJsonError: {
		color: '#ef4444',
		fontSize: 12,
		paddingHorizontal: 12,
		paddingTop: 4,
	},
	debugShowButton: {
		marginHorizontal: 12,
		marginTop: 8,
		marginBottom: 12,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center',
	},
	debugShowButtonText: {
		fontFamily: 'Poppins_700Bold',
		fontSize: 14,
	},
});
