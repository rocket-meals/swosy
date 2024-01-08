import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const CopyIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "content-copy"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
