// @ts-nocheck
import React, {useEffect} from "react";
import {Text} from "native-base";
import TextGenerator from "../../helper/TextGenerator";
import {ConfigHolder} from "../../ConfigHolder";
import {keyof} from "ts-keyof";
import {RouteHelper} from "../../navigation/RouteHelper";

export const AboutUs = (props) => {

	ConfigHolder.instance.setHideDrawer(false, RouteHelper.getNameOfComponent(AboutUs));

	// corresponding componentDidMount
	useEffect(() => {
		//console.log("About Us useEffect");
	}, [props?.route?.params])

	let component = ConfigHolder.plugin.getAboutUsComponent();

	if(!!component){
		return component
	}

	return(
		<>
			<Text>{TextGenerator.generateTextLong()}</Text>
		</>
	)
}

AboutUs.displayName = keyof({ AboutUs });
