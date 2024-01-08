import React from 'react';
import tinycolor from 'tinycolor2';

export class ColorHelper{

	static getHueColors(gradientSteps?, maximumValue?){
		if(!gradientSteps){
			gradientSteps = 20;
		}
		if(!maximumValue){
			maximumValue = 359;
		}
		return ColorHelper.getColors(ColorHelper.getHueStepColor, gradientSteps, maximumValue);
	}

	static getHueStepColor(i: number){
		return tinycolor({ s: 1, l: 0.5, h: i }).toHexString();
	}

	static getColors(getStepColor, gradientSteps, maximumValue){
		const colors = [];
		const values = ColorHelper.getStepValues(gradientSteps, maximumValue);
		for (let value of values) {
			colors.push(
				getStepColor(value)
			);
		}
		return colors;
	}

	static getStepValues(gradientSteps, maximumValue){
		const values = [];
		for (let i = 0; i <= gradientSteps; i++) {
			values.push(
				i * maximumValue / gradientSteps
			);
		}
		return values;
	}
}
