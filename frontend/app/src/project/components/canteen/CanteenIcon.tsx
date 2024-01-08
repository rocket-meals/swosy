// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import {Ionicons} from "@expo/vector-icons";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
    color?: string
    size?: string,
    accessibilityLabel?: string,
}
export const CanteenIcon: FunctionComponent<AppState> = (props) => {

  return (
      <Icon name={"restaurant"} as={Ionicons} color={props.color} accessibilityLabel={props?.accessibilityLabel} />
  )
}
