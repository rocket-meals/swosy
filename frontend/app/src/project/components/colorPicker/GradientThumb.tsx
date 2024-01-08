import React, {FunctionComponent, PureComponent, useState} from 'react';
import {View} from "native-base";

export interface AppState{
	backgroundColor: any
}
export const GradientThumb: FunctionComponent<AppState> = (props) => {
	const size: number = 20;
	const outerSize = size+3;

	return (
		<View style={{width: outerSize, height: outerSize, borderRadius: outerSize, backgroundColor: "black", justifyContent: "center", alignItems: "center"}}>
			<View style={{width: size, height: size, borderRadius: size, backgroundColor: props.backgroundColor}}>

			</View>
		</View>
	);
}