import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const TitleIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "tag-text"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
