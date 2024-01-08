import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const DeleteIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "trash-can"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
