// @ts-nocheck
import React from "react";
import {ColorHelper} from "../../helper/ColorHelper";
import {ColoredCrossLottie} from "./ColoredCrossLottie";

export const ProjectColoredCrossLottie = ({source, ...props}: any) => {

	const projectColor = ColorHelper.useProjectColor();


	let rocketMealsColor = "#EE581F" // [0.9333,0.3451,0.1216] // "#EE581F" is the default color for RocketMeals projects
	const useColorToReplace = projectColor || rocketMealsColor;
	let colorReplaceMap = {};

	let searchForColor = "#FF00FF" // which is translated in LottieRGB [1,0,1] // RGB 0..1
	// In order to support Project Colored Lottie Files, replace the color which should be replaced with the LottieRGB Value

	if(!!projectColor){
		colorReplaceMap = {
			// TODO: Set the color in the lottie files and shadings into a better detectable like: #FF00FF or something
			[searchForColor]: projectColor,
		}
	}

	return <ColoredCrossLottie source={source} colorReplaceMap={colorReplaceMap} {...props} />

}
