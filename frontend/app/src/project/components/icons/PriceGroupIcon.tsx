import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	color?,
}
export const PriceGroupIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "currency-eur"

	return(
		<Icon name={iconName} color={props.color} />
	)
}
