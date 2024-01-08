import React, {FunctionComponent, useEffect} from 'react';
import HueGradient from "./HueGradient";
import {Slider, View} from "native-base";
import {HueSliderThumb} from "./HueSliderThumb";
import {GradientThumb} from "./GradientThumb";

export interface AppState{
	onValueChange: any,
	value: number,
	gradient: any,
	maximumValue: number,
	step: number,
	thumbTintColor: string
}
export const GradientSlider: FunctionComponent<AppState> = (props) => {

	useEffect(() => {
		
	}, [props])

	return (
		<View style={{flex: 1, minHeight: 20, width: "100%", position: "relative", backgroundColor: "green"}}>
			<View style={{flex: 1}}>
				{props.gradient}
			</View>
			<View style={{position: "absolute", width: "100%", height: "100%"}}>
				<Slider
					onChange={(value) => {
						props.onValueChange(value);
					}}
					size="lg"
					width={"100%"} defaultValue={props.value} minValue={0} maxValue={props.maximumValue} accessibilityLabel="Hue Color" step={props.step}>
					<Slider.Track>
						<Slider.FilledTrack bg={"transparent"} />
					</Slider.Track>
					<Slider.Thumb borderWidth="0" bg="transparent">
						<GradientThumb backgroundColor={props.thumbTintColor} />
					</Slider.Thumb>
				</Slider>
			</View>
		</View>
	)
}