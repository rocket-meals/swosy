import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import tinycolor from 'tinycolor2';
import {Gradient} from './Gradient';

class SaturationGradient extends Component {

	static maximumValue = 1;

	static getStepColor(color: any, i: number){
		return tinycolor({ ...color, s: i }).toHexString();
	}

	static getStepValues(amount: number){
		return Gradient.getStepValues(amount, SaturationGradient.maximumValue);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (this.props.color.h !== nextProps.color.h) {
			return true;
		}
		if (this.props.color.l !== nextProps.color.l) {
			return true;
		}
		return false;
	}

	render() {
		const { style, color, gradientSteps } = this.props;
		return (
			<Gradient
				style={style}
				gradientSteps={gradientSteps}
				getStepColor={SaturationGradient.getStepColor.bind(this, this.props.color)}
				maximumValue={1}
			/>
		);
	}
}

export default SaturationGradient;

SaturationGradient.propTypes = {
	color: PropTypes.shape({
		h: PropTypes.number.isRequired,
		s: PropTypes.number.isRequired,
		l: PropTypes.number.isRequired
	}).isRequired,
	gradientSteps: PropTypes.number.isRequired
};