import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const LoginIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "login"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
