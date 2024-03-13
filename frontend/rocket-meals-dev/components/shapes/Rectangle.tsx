import React from 'react';
import {DimensionValue, View, ViewProps} from 'react-native';
import {StyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

export type AspectRatio = number | [number, number] | { width: number, height: number };

//https://www.npmjs.com/package/react-rectangle/v/1.2.0
export type MyCardForResourcesWithImageProps = {
    children?: React.ReactNode,
    aspectRatio?: AspectRatio,
    style?: StyleProp<ViewProps>
}

const defaultAspectRatio = 1;

// define the button component
export const Rectangle = ({aspectRatio, children, style, ...props}: MyCardForResourcesWithImageProps) => {
	const usedAspectRatio = aspectRatio || defaultAspectRatio;

	const multiplier = calculateAspectRatio(usedAspectRatio);

	return (
		<View style={[{ position: 'relative'}, style]} {...props}>
			<View style={{ paddingTop: (100 * multiplier + '%') as DimensionValue }} />
			<View style={{ position: 'absolute', bottom: 0, left: 0, top: 0, right: 0 }}>{children}</View>
		</View>
	);
};

const calculateAspectRatio = (aspectRatio: AspectRatio) => {
	// if number return 1 / aspectRatio

	if (typeof aspectRatio === 'number') {
		return 1 / aspectRatio;
	}

	// if array return aspectRatio[1] / aspectRatio[0]

	const isArray = Array.isArray(aspectRatio);
	if (isArray) {
		const firstElement = aspectRatio[0];
		const secondElement = aspectRatio[1];
		if (firstElement !== undefined && secondElement !== undefined) {
			return secondElement / firstElement;
		} else {
			return defaultAspectRatio;
		}
	} else {
		// if object return aspectRatio.height / aspectRatio.width
		if (aspectRatio.width !== undefined && aspectRatio.height !== undefined) {
			return aspectRatio.height / aspectRatio.width;
		} else {
			return defaultAspectRatio;
		}
	}
};

export { calculateAspectRatio };