import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import PropTypes from 'prop-types';

export const BoxSelector = ({ style, value, getStepColor, getStepValues, onValueChange, gradientSteps }) => {

	const boxSize = 50;

	function renderBox(selectableValue){
		const color = getStepColor(selectableValue);

		let additionalStyle = {};
		if(value===selectableValue){
			additionalStyle = {
				borderColor: "black",
				borderWith: 2,
			}
		}

		return (
			<TouchableOpacity style={[{flex: 1, borderColor: "black", borderWidth: 1, backgroundColor: color}, additionalStyle]} onPress={() => {
				onValueChange(selectableValue)
			}} >
				<View key={selectableValue} style={[{flex: 1, borderColor: "white", borderWidth: 1, backgroundColor: color}, additionalStyle]}>

				</View>
			</TouchableOpacity>
		)
	}

	function renderBoxes(){
		let rows = [];

		const stepValues = getStepValues(gradientSteps);
		for(let stepValue of stepValues){
			rows.push(renderBox(stepValue))
		}

		return <View style={{flex: 1, flexDirection: "row", justifyContent: "space-between"}}>
			{rows}
		</View>;
	}


	return renderBoxes();
};

BoxSelector.propTypes = {
	getStepColor: PropTypes.any.isRequired,
	getStepValues: PropTypes.any.isRequired,
	value: PropTypes.number.isRequired,
	onValueChange: PropTypes.func.isRequired,
	gradientSteps: PropTypes.number.isRequired
};
