import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const TimeStartIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "clock-start"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
