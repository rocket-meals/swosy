/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {KeyboardTypeOptions, Text as NativeText, View as NativeView} from 'react-native';
import {
	Heading as DefaultHeading,
	Input as DefaultInput,
	InputField as DefaultInputField,
	Text as DefaultText,
	View as DefaultView
} from '@gluestack-ui/themed';
import {ComponentProps, MutableRefObject} from 'react';
import {IconProps as DefaultIconProps} from '@expo/vector-icons/build/createIconSet';
import {useThemeDetermined} from '@/states/ColorScheme';
import {getColorAsHex, useMyContrastColor} from '@/helper/color/MyContrastColor';
import {ReturnKeyType} from '@/helper/input/ReturnKeyType';
import {ViewStyle} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import {StyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import {PlatformHelper} from '@/helper/PlatformHelper'; // Use the correct import for TextInput
import {config} from '@gluestack-ui/config';
import {MyAccessibilityRoles} from '@/helper/accessibility/MyAccessibilityRoles';

import { Spinner as DefaultSpinner } from '@gluestack-ui/themed';
import {FontAwesome5, FontAwesome6, Ionicons, MaterialIcons} from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & NativeText['props'];
export type ViewProps = ThemeProps & NativeView['props'];


export type IconProps = DefaultIconProps<any> & {
    family?: string;
};

export function Icon({name, size, family, ...props}: IconProps) {
	const defaultSize = 24
	let useSize = defaultSize;
	if (size) {
		useSize = size;
	}
	let usedFamily = family;
	if (usedFamily === undefined) {
		usedFamily = 'MaterialCommunityIcons';
	}

	let content = null;
	if(usedFamily === 'MaterialCommunityIcons'){
		content = <MaterialCommunityIcons name={name} size={useSize} {...props} />
	}
	if(usedFamily === 'MaterialIcons'){
		content = <MaterialIcons name={name} size={useSize} {...props} />
	}
	if(usedFamily === 'FontAwesome'){
		content = <FontAwesome name={name} size={useSize} {...props} />
	}
	if(usedFamily=== 'FontAwesome5'){
		content = <FontAwesome5 name={name} size={useSize} {...props} />
	}
	if(usedFamily=== 'FontAwesome6'){
		content = <FontAwesome6 name={name} size={useSize} {...props} />
	}
	if(usedFamily=== 'Ionicons'){
		content = <Ionicons name={name} size={useSize} {...props} />
	}


	return <Text>{content}</Text>
}

export const TEXT_SIZE_DEFAULT = 'md';
export const TEXT_SIZE_SMALL = "sm";
export const TEXT_SIZE_EXTRA_SMALL = "xs";

export type TextSizeType = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
export function getFontSizeInPixelBySize(size: TextSizeType | undefined) {
	const tokens = config.tokens;
	const fontSize = tokens.fontSizes
	const usedSize = size || TEXT_SIZE_DEFAULT;
	return fontSize[usedSize];
}

type TextInputProps = {
    myRef?: MutableRefObject<any> // TODO: Fix this type and use forwardRef to pass the ref to the TextInput
    variant?: 'outline' | 'rounded' | 'underlined' | undefined
    size?: 'sm' | 'md' | 'lg';
    hidden?: boolean;
    isPassword?: boolean;
	isNumber?: boolean;
    isDisabled?: boolean;
    isInvalid?: boolean;
    isReadOnly?: boolean;
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onSubmitEditing?: () => void;
    returnKeyType?: ReturnKeyType;
    style?: any;
}
export function TextInput(props: TextInputProps) {
	const textContrastColor = useTextContrastColor();
	const usedFontSize = getFontSizeInPixelBySize(props.size || TEXT_SIZE_DEFAULT);
	let usedColor = props.style?.color;
	if (usedColor === undefined) {
		usedColor = textContrastColor;
	}

	const defaultInputProps: ComponentProps<typeof DefaultInput> = {
		variant: props.variant,
		isDisabled: props.isDisabled,
		isInvalid: props.isInvalid,
		isReadOnly: props.isReadOnly,
	}

	if (defaultInputProps.variant === undefined) {
		defaultInputProps.variant = 'outline';
	}

	let keyboardType: KeyboardTypeOptions = 'default'
	// set mask to password if isPassword is true
	let type: 'text' | 'password' | undefined = 'text';
	if (props.isPassword) {
		type = 'password';
	}
	if (props.isNumber) {
		keyboardType = 'numeric'
	}

	const defaultInputFieldProps: ComponentProps<typeof DefaultInputField> = {
		value: props.value,
		onChangeText: props.onChangeText,
		keyboardType: keyboardType,
		placeholder: props.placeholder,
		type: type
	}

	/**
    return(
        <RNTextInput
            ref={props.myRef}
            style={{height: 40, borderColor: 'gray', borderWidth: 1}}
        />
    )
        */

	return (
		<DefaultInput
			sx={{
				_input:{
					color: usedColor,
				}
			}}
			{...defaultInputProps}
		>
			<DefaultInputField

				returnKeyType={props?.returnKeyType}
				onSubmitEditing={props?.onSubmitEditing}
				ref={props.myRef}
				{...defaultInputFieldProps}
				style={{
					fontSize: usedFontSize
				}}
			/>
		</DefaultInput>
	)
}

export function useViewBackgroundColor() {
	const theme = useThemeDetermined();
	const backgroundColor = theme?.colors?.background;
	const asHex = getColorAsHex(backgroundColor);
	return asHex
}

export function useTextContrastColor() {
	const backgroundColor = useViewBackgroundColor();
	return useMyContrastColor(backgroundColor);
}

export function Heading({style,...props}: TextProps) {
	const textContrastColor = useTextContrastColor();
	// @ts-ignore
	const mergedStyle = {color: textContrastColor}

	// @ts-ignore
	return <DefaultHeading accessibilityRole={MyAccessibilityRoles.Header} selectable={true} style={[mergedStyle, style]} {...props} />;
}

export type MyTextProps = TextProps & {
    size?: TextSizeType | undefined;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    isTruncated?: boolean;
    highlight?: boolean;
    sub?: boolean;
    strikeThrough?: boolean;
}
export function Text({style, size,...props}: MyTextProps) {
	const textContrastColor = useTextContrastColor();
	const isWeb = PlatformHelper.isWeb();

	const usedSize = size || TEXT_SIZE_DEFAULT;

	// @ts-ignore
	const defaultStyle = {
		color: textContrastColor
	}

	if (isWeb) { // only for web since on mobile the text will break automatically
		// @ts-ignore
		defaultStyle['wordBreak'] = 'break-word' // only for web since otherwise a long word would not break
	}

	return <DefaultText selectable={true} size={usedSize} style={[defaultStyle, style]} {...props} />;
}

export function View({style, ...props}: ViewProps) {
	// copy the style to not mutate the original style
	let styleCopy: StyleProp<ViewStyle> = {}
	if (style === undefined) {
		styleCopy = {}
	} else {
		if (Array.isArray(style)) {
			styleCopy = [...style]
		} else {
			// @ts-ignore
			styleCopy = {...style}
		}
	}

	// set flexDirection to column if not set
	// @ts-ignore
	if (styleCopy?.flexDirection === undefined) {
		// @ts-ignore
		styleCopy.flexDirection = 'column'; // Fixes on web the padding issue
	}

	return <DefaultView style={styleCopy} {...props} />;
}

export function MySpinner() {
	const textContrastColor = useTextContrastColor();
	return <DefaultSpinner size={"large"} color={textContrastColor} />
}
