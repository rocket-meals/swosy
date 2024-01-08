import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const NameIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "tag-text"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
