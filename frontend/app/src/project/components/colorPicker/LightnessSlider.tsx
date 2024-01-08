import React from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import tinycolor from 'tinycolor2';
import {GradientSlider} from "./GradientSlider";
import LightnessGradient from "./LightnessGradient";
import {BoxSelector} from "./BoxSelector";
import HueGradient from "./HueGradient";

export const LightnessSlider = ({
							 style,
							 value,
									useBoxes,
							 color,
							 onValueChange,
							 gradientSteps
						 }) => {

	if(useBoxes){
		return <BoxSelector
			getStepColor={LightnessGradient.getStepColor.bind(this, color)}
			getStepValues={LightnessGradient.getStepValues}
			gradientSteps={gradientSteps}
			onValueChange={onValueChange}
			value={value} />
	}

	return (
		<GradientSlider
			gradient={
				<LightnessGradient color={color} gradientSteps={gradientSteps} />
			}
			style={style}
			step={0.01}
			maximumValue={1}
			value={value}
			thumbTintColor={tinycolor({ ...color, l: value }).toHslString()}
			onValueChange={onValueChange}
		/>
	);
};

LightnessSlider.propTypes = {
	useBoxes: PropTypes.bool,
	value: PropTypes.number.isRequired,
	color: PropTypes.shape({
		h: PropTypes.number.isRequired,
		s: PropTypes.number.isRequired,
		l: PropTypes.number.isRequired
	}).isRequired,
	onValueChange: PropTypes.func.isRequired,
	gradientSteps: PropTypes.number.isRequired
};