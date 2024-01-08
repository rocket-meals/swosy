// @ts-nocheck
import React from 'react';
import {useColorMode, useColorModeValue, useToken,} from 'native-base';
import {ConfigHolder} from "../ConfigHolder";

export function useBackgroundColor(props?) {
  const [lightBg, darkBg] = useToken(
    'colors',
    [ConfigHolder.styleConfig.backgroundColor.light, ConfigHolder.styleConfig.backgroundColor.dark],
    'blueGray.900',
  );
  const bgColor = useColorModeValue(lightBg, darkBg);
  return bgColor;
}
