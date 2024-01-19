/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import {Text as NativeText, View as NativeView} from 'react-native';
import {Icon as DefaultIcon, Text as DefaultText, View as DefaultView, Input as DefaultInput, InputField as DefaultInputField} from '@gluestack-ui/themed';

import Colors from '@/constants/Colors';
import {useColorScheme} from './useColorScheme';
import {ComponentProps} from "react";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & NativeText['props'];
export type ViewProps = ThemeProps & NativeView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Icon(props: any){
  return <DefaultIcon {...props} />
}

type TextInputProps = {
    variant?: "outline" | "rounded" | "underlined" | undefined
    size?: "sm" | "md" | "lg";
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

  let defaultInputFieldProps: ComponentProps<typeof DefaultInputField> = {
    value: props.value,
    onChangeText: props.onChangeText,
    placeholder: props.placeholder,
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

export function Text(props: TextProps) {
  return <DefaultText {...props} />;
}

export function View(props: ViewProps) {
  return <DefaultView {...props} />;
}
