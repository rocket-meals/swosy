import React, {useEffect, useState} from "react";
import Rectangle from "../../helper/Rectangle";
import {BasePadding, CrossLottie, Layout} from "../../../kitcheningredients";
import {useBreakpointValue, View, Text} from "native-base";
import noFoodOffersFound from "../../assets/noFoodOffersFound.json";
import {AppTranslation} from "../translations/AppTranslation";
import {ColoredCrossLottie} from "../animations/ColoredCrossLottie";
import {ProjectColoredCrossLottie} from "../animations/ProjectColoredCrossLottie";
import {AnimatedLogo} from "../AnimatedLogo";

export const NoFoodOffersFound = ({children,...props}: any) => {

	const noFoundWidths = {
		base: "60%",
		md: Layout.WIDTH_MD*0.7,
		lg: Layout.WIDTH_LG*0.6,
		xl: Layout.WIDTH_XL*0.5
	}
	const noFoundWidth = useBreakpointValue(noFoundWidths);

	return (
		<BasePadding>
			<View style={{width: "100%", alignItems: "center"}}>
				<AppTranslation id={"foodoffersNothingFound"} />
				<View style={{width: noFoundWidth}}>
					<Rectangle>
						<ProjectColoredCrossLottie source={noFoodOffersFound} flex={1} />
					</Rectangle>
				</View>
			</View>
		</BasePadding>
	)
}
