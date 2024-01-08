// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import {Ionicons} from "@expo/vector-icons";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
    color?: string
    size?: string
}
export const BuildingsIcon: FunctionComponent<AppState> = (props) => {

  return (
      <Icon name={"map-search"} color={props.color} />
  )
}
