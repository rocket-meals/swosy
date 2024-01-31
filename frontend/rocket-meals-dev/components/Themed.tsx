/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {Text as NativeText, View as NativeView} from 'react-native';
import {
    Heading as DefaultHeading,
    Input as DefaultInput,
    InputField as DefaultInputField,
    Text as DefaultText,
    View as DefaultView
} from '@gluestack-ui/themed';
import {ComponentProps} from "react";
import {IconProps as DefaultIconProps} from "@expo/vector-icons/build/createIconSet";
import {useThemeDetermined} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";
import {getColorAsHex, useMyContrastColor} from "@/helper/color/MyContrastColor";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & NativeText['props'];
export type ViewProps = ThemeProps & NativeView['props'];


export type IconProps = DefaultIconProps<any> & {
    family?: string;
};

export function Icon({name, size, family, ...props}: IconProps){
    let defaultSize = 24
    let useSize = defaultSize;
    if(!!size){
        useSize = size;
    }
  return <Text><MaterialCommunityIcons name={name} size={useSize} {...props} /></Text>
}

type TextInputProps = {
    variant?: "outline" | "rounded" | "underlined" | undefined
    size?: "sm" | "md" | "lg";
    hidden?: boolean;
    isPassword?: boolean;
    isDisabled?: boolean;
    isInvalid?: boolean;
    isReadOnly?: boolean;
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
}
export function TextInput(props: TextInputProps){
  let defaultInputProps: ComponentProps<typeof DefaultInput> = {
    variant: props.variant,
    size: props.size,
    isDisabled: props.isDisabled,
    isInvalid: props.isInvalid,
    isReadOnly: props.isReadOnly,
  }

  if(defaultInputProps.variant === undefined){
    defaultInputProps.variant = "outline";
  }
    if(defaultInputProps.size === undefined){
        defaultInputProps.size = "md";
    }

    // set mask to password if isPassword is true
    let type: "text" | "password" | undefined = "text";
    if(props.isPassword){
        type = "password";
    }

  let defaultInputFieldProps: ComponentProps<typeof DefaultInputField> = {
    value: props.value,
    onChangeText: props.onChangeText,
    placeholder: props.placeholder,
      type: type
  }

  return(
      <DefaultInput
          {...defaultInputProps}
      >
        <DefaultInputField
            {...defaultInputFieldProps}
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
    let textContrastColor = useTextContrastColor();
    // @ts-ignore
    let mergedStyle = {color: textContrastColor}

    return <DefaultHeading selectable={true} style={[mergedStyle, style]} {...props} />;
}

export function Text({style,...props}: TextProps) {
    let textContrastColor = useTextContrastColor();
    // @ts-ignore
    let mergedStyle = {color: textContrastColor}

  return <DefaultText selectable={true} style={[mergedStyle, style]} {...props} />;
}

export function View(props: ViewProps) {
  return <DefaultView {...props} />;
}
