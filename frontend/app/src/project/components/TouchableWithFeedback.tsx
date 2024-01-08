import React, {FunctionComponent, useEffect, useState} from "react";
import {TouchableNativeFeedback, TouchableOpacity} from "react-native";


interface AppState {
	onPress: void
}
export const TouchableWithFeedback: FunctionComponent<AppState> = (props) => {

	return(
		<TouchableOpacity style={{width: "100%", height: "100%", borderColor: "transparent", borderWidth: 0}} onPress={props.onPress}>
			{props.children}
		</TouchableOpacity>
	)
}