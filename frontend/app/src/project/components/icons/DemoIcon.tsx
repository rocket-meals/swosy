import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const DemoIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "presentation"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
