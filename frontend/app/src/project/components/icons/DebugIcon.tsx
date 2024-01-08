import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const DebugIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "bug"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
