// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import {Ionicons} from "@expo/vector-icons";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
    color?: string
    size?: string
}
export const HousingIcon: FunctionComponent<AppState> = (props) => {

  return (
      <Icon name={"home-modern"} color={props.color} />
  )
}
