import React, {FunctionComponent} from 'react';
import {TouchableOpacity, View} from 'react-native';
import PropTypes from 'prop-types';
import {GridLayout} from "../../layouts/GridLayout";
import {useBreakpointValue} from "native-base";
import {GridList, Layout} from "../../../kitcheningredients";
import {ColorHelper} from "./ColorHelper";

interface SimpleColorPickerProps {
	onColorChange: (color: string) => Promise<boolean>;
}
export const SimpleColorPicker: FunctionComponent<SimpleColorPickerProps> = (props) => {

	const colorWidth = 40;

	const noFoundWidths = {
		base: 4,
		sm: 5,
		md: 6,
		lg: 7,
		xl: 8
	}

	async function onPress(color){
		if(props?.onColorChange){
			await props.onColorChange(color);
		}
	}

	function renderColor(color){
		return <TouchableOpacity style={{width: "100%", alignItems: "center", justifyContent: "center"}} onPress={() => {
			onPress(color);
		}}>
			<View style={{backgroundColor: color, borderColor: "black", borderWidth: 1, borderRadius: colorWidth, width: colorWidth, height: colorWidth}} />
		</TouchableOpacity>
	}

	function renderColors(){
		let output = []
		const steps = 20;
		let colors = ColorHelper.getHueColors(steps)
		for(let color of colors){
			output.push(renderColor(color));
		}
		return output;
	}

	return <GridList beakpointsColumns={noFoundWidths}>
		{renderColors()}
	</GridList>
}
