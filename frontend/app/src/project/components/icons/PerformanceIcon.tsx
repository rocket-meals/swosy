import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const PerformanceIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "speedometer"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
