// @ts-nocheck
import React from "react";
import {CrossLottie, Icon} from "../../../kitcheningredients";
import {View, Text} from "native-base";
import {usePerformanceMode} from "../../helper/synchedJSONState";

export const ColoredCrossLottie = ({source, colorReplaceMap,...props}: any) => {

	let performanceModeUsing = undefined;
	try{
		const [performanceMode, setPerformanceMode] = usePerformanceMode();
		performanceModeUsing = performanceMode;
	} catch (err){ // Maybe this is not initialized yet, since we may use this before storage is loaded
		//
	}

	if(performanceModeUsing){
		return <View style={{borderColor: "black", borderWidth: 1, justifyContent: "center", alignItems: "center", width: "100%", height: "100%"}}>
			<View style={{borderColor: "white", borderWidth: 1, justifyContent: "center", alignItems: "center", width: "100%", height: "100%"}}>
				<Icon name={"image-off"}/>
				<Text>{"Animation disabled"}</Text>
			</View>
		</View>
	}


	function hexToLottieColor(hex) {
		let r = (parseInt(hex.slice(1, 3), 16) / 255).toFixed(4);
		let g = (parseInt(hex.slice(3, 5), 16) / 255).toFixed(4);
		let b = (parseInt(hex.slice(5, 7), 16) / 255).toFixed(4);
		return [parseFloat(r), parseFloat(g), parseFloat(b)];
	}

	if(!colorReplaceMap){
		colorReplaceMap = {};

		/*
		colorReplaceMap = {
			"#FF6224": "#FF00FF"
		};
		*/
	}

// Convert colorReplaceMap to Lottie color format
	for(let color in colorReplaceMap){
		colorReplaceMap[hexToLottieColor(color).toString()] = hexToLottieColor(colorReplaceMap[color]);
	}

	function replaceColorsInLottie(lottieJSON, colorReplaceMap) {
		if (Array.isArray(lottieJSON)) {
			for (let i = 0; i < lottieJSON.length; i++) {
				lottieJSON[i] = replaceColorsInLottie(lottieJSON[i], colorReplaceMap);
			}
		} else if (typeof lottieJSON === 'object' && lottieJSON !== null) {
			for (let key in lottieJSON) {
				if (key === 'c') {
					if (lottieJSON[key].a === 0 && colorReplaceMap[lottieJSON[key].k.toString()]) {
						lottieJSON[key].k = colorReplaceMap[lottieJSON[key].k.toString()];
					}
				} else {
					lottieJSON[key] = replaceColorsInLottie(lottieJSON[key], colorReplaceMap);
				}
			}
		}
		return lottieJSON;
	}

	let coloredSource = replaceColorsInLottie(source, colorReplaceMap);

	return <CrossLottie source={coloredSource} {...props} />

}
