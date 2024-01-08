import React from "react";
import {Text, View} from "native-base";
import {FadeInFadeOut} from "../animatedViews/FadeInFadeOut";

export const DemoModeLogo = (props) => {

	return (
		<View>
			<FadeInFadeOut>
				<Text selectable={false}>{"DEMO MODE"}</Text>
			</FadeInFadeOut>
		</View>
	);

}
