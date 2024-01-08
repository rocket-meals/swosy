import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const DescriptionIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "file-document"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
