import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const ColorIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "brush"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
