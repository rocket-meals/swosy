import React, {useEffect, useState} from "react";
import {BreakPoint, BreakPointsDictionary, useBreakPointValue} from "@/helper/device/DeviceHelper";
import {DimensionValue} from "react-native";
import {View, Text} from "@/components/Themed";
import {Rectangle} from "@/components/shapes/Rectangle";
import {MyLottieAnimation} from "@/components/lottie/MyLottieAnimation";
import moneyConfident from "@/assets/animations/accountBalance/moneyConfident.json";


export const MoneyConfident = ({children,...props}: any) => {

	const noFoundWidths: BreakPointsDictionary<DimensionValue> = {
		[BreakPoint.sm]: "50%",
		[BreakPoint.md]: "20%",
		[BreakPoint.lg]: "10%",
	}
	const noFoundWidth = useBreakPointValue<DimensionValue>(noFoundWidths);

	const accessibilityLabel = "Animation Money confident";

	return (
		<View style={{width: "100%", alignItems: "center"}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle>
					<MyLottieAnimation style={{
						width: "100%",
						height: "100%"
					}} source={moneyConfident}  accessibilityLabel={accessibilityLabel} />
				</Rectangle>
			</View>
		</View>
	)
}
