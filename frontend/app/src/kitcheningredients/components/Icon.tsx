// @ts-nocheck
import {Icon as NativeBaseIcon, Text, useTheme} from "native-base";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import React, {FunctionComponent} from "react";
import {InterfaceIconProps} from "native-base/lib/typescript/components/primitives/Icon/types";
import {useThemeTextColor} from "../helper/HelperHooks";
import {AccessibilityInfo, PixelRatio} from "react-native";

interface AppState {
  invert?: boolean;
  useDarkTheme?: boolean
}
export const Icon: FunctionComponent<InterfaceIconProps & AppState> = ({as, size, invert, useDarkTheme, ...props}) => {

  const defaultColor = useThemeTextColor(invert, useDarkTheme);

  const theme = useTheme();

  let fontScale = PixelRatio.getFontScale();

  let defaultAs = MaterialCommunityIcons;
  if(!!as){
    defaultAs = as;
  }

  let defaultSize = "lg";
  let useSize = defaultSize;
  if(!!size){
    useSize = size;
  }

  let sizes = theme["components"]["Icon"]["sizes"]
      /**
       const sizes = {
  '2xs': 2,
  'xs': 3,
  'sm': 4,
  'md': 5,
  'lg': 6,
  'xl': 7,
  '2xl': 8,
  '3xl': 9,
  '4xl': 10,
  '5xl': 12,
  '6xl': 16,
};
       *
       */

    const minKey = '2xs';
    const maxKey = '6xl';

    // Native Base does not scale the icons when the fontScale is set up.
    // In order to achieve this, we need to do it on our own.

    // Calculate the multiplied new size based on fontScale
    let scaledSize = sizes[useSize] * fontScale;

    // Find the closest key corresponding to the clamped size
    let closestKey = minKey; // Initialize with the smallest size
    for (const [key, value] of Object.entries(sizes)) {
      if (value <= scaledSize) {
        closestKey = key;
      } else {
        break;
      }
    }

  // Clamp the scaled icon size with min and max keys (e.g., '2xs' and '6xl')
  const clampedKey = sizes[closestKey] <= sizes[maxKey] ? closestKey : maxKey;

    useSize = clampedKey;

  const color = props?.color || defaultColor;

	return (
    <NativeBaseIcon as={defaultAs} {...props} size={useSize} color={color} />
  )
}
