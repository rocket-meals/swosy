import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base"

import InlineSVG from 'svg-inline-react';
import {SvgXml} from "react-native-svg";
import {Platform} from "react-native";
import {PlatformHelper} from "../../helper/PlatformHelper";

export class AvatarRenderer extends React.Component{

	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	shouldComponentUpdate(nextProps: Readonly<{}>, nextState: Readonly<{}>, nextContext: any): boolean {
		return JSON.stringify(nextProps)!==JSON.stringify(this.props) || JSON.stringify(nextState)!==JSON.stringify(this.state)
	}

	componentDidCatch(error, info) {
		//console.log("Has Error!");
		//console.log(error);
		// Display fallback UI
		this.setState({ hasError: true });
	}

	render(){
		if(this.state?.hasError){
			//console.log("Wow, wait, heres an error");
			return <Text>{"?"}</Text>
		}

		if(PlatformHelper.isWeb()){
			return <InlineSVG src={this.props?.svg} style={{width: "100%", height: "100%"}} />
		} else {
			return <SvgXml xml={this.props?.svg} width="100%" height="100%" />
		}
	}

}
