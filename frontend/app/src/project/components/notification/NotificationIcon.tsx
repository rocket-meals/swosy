import React, {FunctionComponent, useState} from "react";
import {Icon} from "../../../kitcheningredients";

export interface AppState{
	active?: boolean;
	color?,

}
export const NotificationIcon: FunctionComponent<AppState> = ({active, ...props}) => {

	const iconName = active ? "bell" : "bell-off";
	return <Icon name={iconName} {...props} color={props?.color} />
}
