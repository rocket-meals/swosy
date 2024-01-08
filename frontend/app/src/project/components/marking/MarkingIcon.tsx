// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import {Ionicons} from "@expo/vector-icons";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
    color?: string
    size?: any,
    accessibilityLabel?: string,
}
export const MarkingIcon: FunctionComponent<AppState> = ({color, size, accessibilityLabel, ...props}) => {

  return (
      <Icon name={"medkit"} as={Ionicons} color={color} accessibilityLabel={accessibilityLabel} {...props} />
  )
}
