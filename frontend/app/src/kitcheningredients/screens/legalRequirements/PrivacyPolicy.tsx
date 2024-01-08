// @ts-nocheck
import React, {useEffect} from "react";
import {Text, View} from "native-base";
import {ConfigHolder} from "../../ConfigHolder";

import {RenderHTML} from "../../utils/RenderHTML";
import TextGenerator from "../../helper/TextGenerator";
import {License} from "./License";
import {keyof} from "ts-keyof";
import {RouteHelper} from "../../navigation/RouteHelper";

export const PrivacyPolicy = (props) => {

  ConfigHolder.instance.setHideDrawer(false, RouteHelper.getNameOfComponent(PrivacyPolicy));

	// corresponding componentDidMount
	useEffect(() => {

	}, [props?.route?.params])

	let component = ConfigHolder.plugin.getPrivacyPolicyComponent();

	if(!!component){
		return component
	}

	return(
			<View>
				<Text>{TextGenerator.generateTextLong()}</Text>
			</View>
	)
}

PrivacyPolicy.displayName = keyof({ PrivacyPolicy });
