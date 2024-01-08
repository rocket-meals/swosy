import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const SortIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "sort"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
