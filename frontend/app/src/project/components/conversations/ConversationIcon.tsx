// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
    color?: string
    size?: string
}
export const ConversationIcon: FunctionComponent<AppState> = (props) => {

  return (
      <Icon name={"chat"} color={props.color} />
  )
}
