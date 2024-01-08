// @ts-nocheck
import React from 'react';
import {useTheme,} from 'native-base';
import ColorCodeHelper from "./ColorCodeHelper";

export function useDefaultButtonColor() {
  const theme = useTheme();
  const isDarkMode = ColorCodeHelper.isDarkMode()
  if(isDarkMode) {
    return theme?.components?.Button?.defaultProps._dark?.backgroundColor
  } else {
    return theme?.components?.Button?.defaultProps._light.backgroundColor
  }
}
