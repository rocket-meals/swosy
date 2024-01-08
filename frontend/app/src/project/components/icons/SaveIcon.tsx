import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const SaveIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "content-save"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
