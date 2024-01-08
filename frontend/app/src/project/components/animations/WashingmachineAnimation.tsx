// @ts-nocheck
import React, {useEffect, useState} from "react";
import {CrossLottie, KitchenSkeleton, Layout} from "../../../kitcheningredients";
import {useBreakpointValue, View, Text} from "native-base";
import washingmachine from "../../assets/washingmachine.json";
import washingmachineEmpty from "../../assets/washingmachine-empty.json";
import Rectangle from "../../helper/Rectangle";
import {ProjectColoredCrossLottie} from "./ProjectColoredCrossLottie";

export const WashingmachineAnimation = ({children, active,...props}: any) => {

	const noFoundWidths = {
		base: "100%",
	}
	const noFoundWidth = useBreakpointValue(noFoundWidths);

	const activeAsBoolean = !!active; // active can be undefined, null, 0, 1, true, false

	const source = activeAsBoolean ? washingmachine : washingmachineEmpty;

	return (
		<View style={{width: "90%", alignItems: "center"}}>
			<View style={{width: noFoundWidth}}>
				<Rectangle aspectRatio={130/150}>
					<ProjectColoredCrossLottie source={source} flex={1} autoPlay={activeAsBoolean} />
				</Rectangle>
			</View>
		</View>
	)
}
