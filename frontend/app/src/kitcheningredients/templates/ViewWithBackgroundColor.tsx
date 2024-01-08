// @ts-nocheck
import React from 'react';
import {useColorMode, useColorModeValue, useToken, View} from 'native-base';
import {useBackgroundColor} from "./useBackgroundColor";

export const ViewWithBackgroundColor = (props) => {
  const bgColor = useBackgroundColor()
  return <View style={{flex: 1, width: "100%", backgroundColor: bgColor}}
  >
    {props.children}
  </View>
}
