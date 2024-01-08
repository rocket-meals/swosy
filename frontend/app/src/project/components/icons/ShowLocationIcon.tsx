import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
	style?,
}
export const ShowLocationIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "google-maps"

	return(
		<Icon name={iconName} color={props?.color} style={props?.style} />
	)
}
