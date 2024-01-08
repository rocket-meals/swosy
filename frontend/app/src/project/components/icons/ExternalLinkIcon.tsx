import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const ExternalLinksIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "launch"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
