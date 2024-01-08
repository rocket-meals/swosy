// @ts-nocheck
import React, {useEffect} from "react";
import {Text} from "native-base";
import TextGenerator from "../../helper/TextGenerator";
import {ConfigHolder} from "../../ConfigHolder";
import {keyof} from "ts-keyof";
import {RouteHelper} from "../../navigation/RouteHelper";

export const CookiePolicy = (props) => {

	ConfigHolder.instance.setHideDrawer(false, RouteHelper.getNameOfComponent(CookiePolicy));

	// corresponding componentDidMount
	useEffect(() => {
		//console.log("About Us useEffect");
	}, [props?.route?.params])

	let component = ConfigHolder.plugin.getCookiePolicyComponent();

	if(!!component){
		return component
	}

	return(
		<>
			<Text>{TextGenerator.generateTextLong()}</Text>
		</>
	)
}

CookiePolicy.displayName = keyof({ CookiePolicy });
