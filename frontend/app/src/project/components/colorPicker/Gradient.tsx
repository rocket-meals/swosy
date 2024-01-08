import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import PropTypes from 'prop-types';
import {PlatformHelper} from "../../helper/PlatformHelper";

const GradientComponent = ({ style, gradientSteps, maximumValue, getStepColor }) => {
	const rows = [];
	let colors = getColors(getStepColor, gradientSteps, maximumValue);
	let i = 0;
	for (let color of colors) {
		rows.push(
			<View
				key={i}
				style={{
					flex: 1,
					marginLeft: PlatformHelper.isIOS() ? -StyleSheet.hairlineWidth : 0,
					backgroundColor: getStepColor(i * maximumValue / gradientSteps)
				}}
			/>
		);
		i++;
	}
	return <View style={[styles.container, style]}>{rows}</View>;
};

function getStepValues(gradientSteps, maximumValue){
	const values = [];
	for (let i = 0; i <= gradientSteps; i++) {
		values.push(
			i * maximumValue / gradientSteps
		);
	}
	return values;
}

function getColors(getStepColor, gradientSteps, maximumValue){
	const colors = [];
	const values = getStepValues(gradientSteps, maximumValue);
	for (let value of values) {
		colors.push(
			getStepColor(value)
		);
	}
	return colors;
}


export const Gradient = Object.assign(GradientComponent, { getColors: getColors, getStepValues: getStepValues })

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'stretch'
	}
});

GradientComponent.propTypes = {
	gradientSteps: PropTypes.number.isRequired,
	maximumValue: PropTypes.number.isRequired,
	getStepColor: PropTypes.func.isRequired
};
