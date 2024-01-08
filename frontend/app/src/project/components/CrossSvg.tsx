import React, {FunctionComponent, useEffect, useState} from "react";
import {useColorMode, useTheme} from "native-base";

import InlineSVG from 'svg-inline-react';
import {SvgXml} from "react-native-svg";
import {Platform} from "react-native";
import {PlatformHelper} from "../helper/PlatformHelper";

export interface AppState{
	svg: string,
}
export const CrossSvg: FunctionComponent<AppState> = (props) => {

	const colorMode = useColorMode();
	const theme = useTheme();
	const colors = theme?.colors;
	const lightText = colors?.lightText;
	const darkText = colors?.darkText;

	const themedFillColor = colorMode.colorMode==="dark" ? lightText : darkText;

	const fillColor = themedFillColor || "#FFFFFF";

	if(PlatformHelper.isWeb()){
		return <InlineSVG src={props?.svg} style={{width: "100%", height: "100%", fill: fillColor}} />
	} else {
		return <SvgXml xml={props?.svg} width="100%" height="100%" fill={fillColor} />
	}

}
