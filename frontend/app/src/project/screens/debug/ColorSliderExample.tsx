import React, {useEffect, useState} from "react";
import {Input, ScrollView, Spacer, Text, View} from "native-base";
import {ColorSlider} from "../../components/colorPicker/ColorSlider";

export const ColorSliderExample = (props) => {

	let initialColor = "#8800FF";
	const [color, setColor] = useState(initialColor);

	return(
		<>
			<Text>{"Selected Color"}</Text>
			<Text>{"color: "+color}</Text>
			<Spacer />
			<Text>{"Color Box Picker"}</Text>
			<ColorSlider useBoxes={true} gradientSteps={10} advanced={true} initialColor={initialColor} onChangeHexColor={(color) => {
				setColor(color)
			}} />
			<Spacer />
			<Text>{"Color Slider"}</Text>
			<ColorSlider advanced={true} initialColor={initialColor} onChangeHexColor={(color) => {
				setColor(color)
			}} />

		</>
	)
}