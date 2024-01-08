import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
	accessibilityLabel?: string,
}
export const ReloadIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "reload"

	return(
		<Icon name={iconName} color={props.color} accessibilityLabel={props?.accessibilityLabel} />
	)
}
