// @ts-nocheck
import React, {useEffect, useState} from "react";
import {CrossLottie, Layout} from "../../../../kitcheningredients";
import {useBreakpointValue, View, Text} from "native-base";
import Rectangle from "../../../helper/Rectangle";
import moneyGraph from "../../../assets/accountBalance/moneyGraph.json";

export const MoneyGraph = ({children,...props}: any) => {

	const noFoundWidths = {
		base: "40%",
		sm: "30%",
		md: Layout.WIDTH_MD*0.3,
		lg: Layout.WIDTH_LG*0.3,
		xl: Layout.WIDTH_XL*0.2
	}
	const noFoundWidth = useBreakpointValue(noFoundWidths);

	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle>
					<CrossLottie source={moneyGraph} flex={1} />
				</Rectangle>
			</View>
		</View>
	)
}
