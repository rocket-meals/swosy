// @ts-nocheck
import React from "react";
import {View} from "native-base";
import {AppTranslation} from "../translations/AppTranslation";
import {AnimationEmptyNotingFound} from "./AnimationEmptyNotingFound";

export const AnimationSeemsEmpty = ({children,...props}: any) => {

	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{height: 30}}></View>
			<AppTranslation id={"seemsEmpty"} />
			<AnimationEmptyNotingFound />
		</View>
	)
}
