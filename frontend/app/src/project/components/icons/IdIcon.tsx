import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const IdIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "tag"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
