import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import PropTypes from 'prop-types';
import tinycolor from 'tinycolor2';
import {GradientSlider} from "./GradientSlider";
import HueGradient from "./HueGradient";
import {BoxSelector} from "./BoxSelector";

export const HueSlider = ({ style, value, onValueChange, gradientSteps, useBoxes }) => {

	if(useBoxes){
		return <BoxSelector
			getStepColor={HueGradient.getStepColor}
			getStepValues={HueGradient.getStepValues}
			gradientSteps={gradientSteps}
			onValueChange={onValueChange}
			value={value} />
	}

	return (
		<GradientSlider
			gradient={<HueGradient gradientSteps={gradientSteps} />}
			style={style}
			step={1}
			maximumValue={359}
			value={value}
			thumbTintColor={tinycolor({ s: 1, l: 0.5, h: value }).toHslString()}
			onValueChange={onValueChange}
		/>
	);
};

HueSlider.propTypes = {
	useBoxes: PropTypes.bool,
	value: PropTypes.number.isRequired,
	onValueChange: PropTypes.func.isRequired,
	gradientSteps: PropTypes.number.isRequired
};