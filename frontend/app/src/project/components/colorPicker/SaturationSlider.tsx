import React from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import {GradientSlider} from './GradientSlider';
import tinycolor from 'tinycolor2';
import SaturationGradient from "./SaturationGradient";
import {BoxSelector} from "./BoxSelector";
import LightnessGradient from "./LightnessGradient";

export const SaturationSlider = ({
							  style,
							  value,
							  color,
									 useBoxes,
							  onValueChange,
							  gradientSteps
						  }) => {

	if(useBoxes){
		return <BoxSelector
			getStepColor={SaturationGradient.getStepColor.bind(this, color)}
			getStepValues={SaturationGradient.getStepValues}
			gradientSteps={gradientSteps}
			onValueChange={onValueChange}
			value={value} />
	}

	return (
		<GradientSlider
			gradient={
				<SaturationGradient color={color} gradientSteps={gradientSteps} />
			}
			style={style}
			step={0.01}
			maximumValue={1}
			value={value}
			thumbTintColor={tinycolor({ ...color, s: value }).toHslString()}
			onValueChange={onValueChange}
		/>
	);
};

SaturationSlider.propTypes = {
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