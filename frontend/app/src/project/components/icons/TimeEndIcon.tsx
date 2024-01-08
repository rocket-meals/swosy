import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const TimeEndIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "clock-end"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
