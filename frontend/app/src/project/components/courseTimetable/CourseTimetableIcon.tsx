// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import {Ionicons} from "@expo/vector-icons";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
    color?: string
    size?: string,
    accessibilityLabel?: string,
}
export const CourseTimetableIcon: FunctionComponent<AppState> = (props) => {

  return (
      <Icon name={"timetable"} color={props.color} accessibilityLabel={props?.accessibilityLabel} />
  )
}
