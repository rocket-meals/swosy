// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import {Ionicons} from "@expo/vector-icons";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
    color?: string
    size?: string
}
export const AccountBalanceIcon: FunctionComponent<AppState> = (props) => {

  return (
      <Icon name={"card"} as={Ionicons} color={props.color} />
  )
}
