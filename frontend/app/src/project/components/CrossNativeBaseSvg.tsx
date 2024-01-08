import React, {FunctionComponent, useEffect, useState} from "react";
import {useColorMode, useTheme, Icon, View} from "native-base";

import {CrossSvg} from "./CrossSvg";

export interface AppState{
	svg: string,
	contentSpacer?: any
}
export const CrossNativeBaseSvg: FunctionComponent<AppState> = (props) => {

	const spacer = props?.contentSpacer || <Icon name={"account"} />

	return(
		<View style={{flex: 1}}>
			<View style={{opacity: 0}}>
				{spacer}
			</View>
			<View style={{position: "absolute", width: "100%", height: "100%"}}>
				<CrossSvg svg={props.svg} />
			</View>
		</View>
	)

}
