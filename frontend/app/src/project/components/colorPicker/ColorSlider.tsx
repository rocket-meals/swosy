import React, {FunctionComponent, useEffect, useState} from "react";
import {Spacer, View} from "native-base";
import {HueSlider} from "../../components/colorPicker/HueSlider";
import {SaturationSlider} from "../../components/colorPicker/SaturationSlider";
import {LightnessSlider} from "../../components/colorPicker/LightnessSlider";
import tinycolor from 'tinycolor2';

export interface AppState{
	initialColor?: string,
	style?: any,
	rowHeight?: any,
	onChangeHexColor?: any,
	onChangeHslColor?: any,
	advanced?: boolean,
	showColorPreview?: boolean,
	useBoxes?: boolean,
	hueSteps?: number,
	gradientSteps?: number,
	showHue?: boolean,
	showSaturation?: boolean,
	showLightness?: boolean,
}
export const ColorSlider: FunctionComponent<AppState> = (props) => {

	let showColorPreview = false;
	if(props?.showColorPreview!==undefined){
		showColorPreview = props?.showColorPreview;
	}

	const height = props?.rowHeight || 40;
	const spacing = 0;

	const defaultShowHue = true;
	const defaultShowSaturation = false;
	const defaultShowLightness = false;

	let initialShowHue = defaultShowHue;
	if(props?.showHue!==undefined){
		initialShowHue = props.showHue;
	}

	let initialShowSaturation = defaultShowSaturation;
	if(props?.showHue!==undefined){
		initialShowSaturation = props.showHue;
	}

	let initialShowLightness = defaultShowLightness;
	if(props?.showHue!==undefined){
		initialShowLightness = props.showHue;
	}

	if(props?.advanced){
		initialShowHue = true;
		initialShowSaturation = true;
		initialShowLightness = true;
	}

	const [showHue, setShowHue] = useState(initialShowHue);
	const [showSaturation, setShowSaturation] = useState(initialShowSaturation);
	const [showLightness, setShowLightness] = useState(initialShowLightness);

	let initialColor = props.initialColor || "#8800FF";
	let hsl = tinycolor(initialColor).toHsl();
	const [h, setH] = useState(hsl.h);
	const [s, setS] = useState(hsl.s);
	const [l, setL] = useState(hsl.l);
	let hslColor = {h: h, l: l, s: s};
	let color = tinycolor(hslColor).toHexString();

	function changeColor(newH, newL, newS){
		let newHSLColor = {h: newH, l: newL, s: newS};
		if(!!props.onChangeHexColor){
			let color = tinycolor(newHSLColor).toHexString();
			props.onChangeHexColor(color)
		}
		if(!!props.onChangeHslColor){
			props.onChangeHslColor(newHSLColor)
		}
		if(h!==newH){
			setH(newH);
		}
		if(l!==newL){
			setL(newL);
		}
		if(s!==newS){
			setS(newS);
		}
	}

	function renderColorPreview(){
		if(showColorPreview){
			return (
				<View style={{width: 100, height: 100, backgroundColor: color, borderColor: "black", borderWidth: 2}}>

				</View>
			)
		}
		return null;
	}

	function renderHue(){
		if(showHue){
			return(
				<View style={{height: height, width: "100%"}}>
					<HueSlider
						useBoxes={props.useBoxes}
						gradientSteps={props?.hueSteps || props?.gradientSteps || 359}
						value={h}
						onValueChange={(h) => {
							changeColor(h, l, s);
						}}
					/>
				</View>
			)
		}
		return null;
	}

	function renderSaturation(){
		if(showSaturation){
			return(
				<View style={{height: height, width: "100%"}}>
				<SaturationSlider
					useBoxes={props.useBoxes}
					gradientSteps={props?.gradientSteps || 20}
					value={s}
					onValueChange={(s) => {
						changeColor(h, l, s);
					}}
					color={hslColor}
				/>
				</View>
			)
		}
		return null;
	}

	function renderLightness(){
		if(showLightness){
			return(
				<View style={{height: height, width: "100%"}}>
				<LightnessSlider
					useBoxes={props.useBoxes}
					gradientSteps={props?.gradientSteps || 20}
					value={l}
					onValueChange={(l) => {
						changeColor(h, l, s);
					}}
					color={hslColor}
				/>
				</View>
			)
		}
		return null;
	}

	return(
		<View style={[{flexDirection: "row", width: "100%"}, props?.style]}>
			{renderColorPreview()}
			<View style={{flex: 1, flexDirection: "column"}}>
				{renderHue()}
				{renderLightness()}
				{renderSaturation()}
			</View>
		</View>
	)
}