// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import {Ionicons} from "@expo/vector-icons";
import {Icon} from "../../../../kitcheningredients";

export interface AppState{
    color?: string
}
export const NutritionIcon: FunctionComponent<AppState> = (props) => {

  return (
      <Icon name={"nutrition"} as={Ionicons} color={props.color} />
  )
}
