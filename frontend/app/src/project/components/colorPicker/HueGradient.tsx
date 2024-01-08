import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import tinycolor from 'tinycolor2';
import {Gradient, getColors} from './Gradient';

class HueGradient extends PureComponent {

	static maximumValue = 359;

	static getStepColor(i: number){
		return tinycolor({ s: 1, l: 0.5, h: i }).toHexString();
	}

	static getStepValues(amount: number){
		return Gradient.getStepValues(amount, HueGradient.maximumValue);
	}

	render() {
		const { style, gradientSteps } = this.props;
		return (
			<Gradient
				style={style}
				gradientSteps={gradientSteps}
				getStepColor={HueGradient.getStepColor}
				maximumValue={HueGradient.maximumValue}
			/>
		);
	}
}

export default HueGradient;

HueGradient.propTypes = {
	gradientSteps: PropTypes.number.isRequired
};