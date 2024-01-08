import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const CalendarDayIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "calendar-today"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
