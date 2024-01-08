import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const LastVisitedIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "clock-time-three-outline"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
