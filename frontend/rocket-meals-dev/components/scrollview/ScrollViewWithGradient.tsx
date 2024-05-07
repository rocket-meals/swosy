import React, {FunctionComponent} from 'react';
import {ScrollViewProps} from 'react-native';
import {ShowMoreGradient} from './ShowMoreGradient';
import {ShowMoreGradientPlaceholder} from './ShowMoreGradientPlaceholder';
import {View, Text} from '@/components/Themed';
import {MyScrollView} from '@/components/scrollview/MyScrollView';

interface AppState {
    hideGradient?: boolean
    gradientBackgroundColor?: string
    gradientHeight?: number
}
export const ScrollViewWithGradient: FunctionComponent<AppState & ScrollViewProps> = ({children, gradientHeight, ...props}) => {
	const horizontal: boolean | undefined | null = !!props?.horizontal;

	const noChildren = !children || children === null || (Array.isArray(children) && children.length === 0);
	const hideGradient = props.hideGradient || noChildren

	const renderedGradient = hideGradient ? null : <ShowMoreGradient amountOfGradientSteps={20} gradientHeight={gradientHeight} horizontal={horizontal} gradientBackgroundColor={props?.gradientBackgroundColor} />
	const renderedPlaceholder = hideGradient ? null : <ShowMoreGradientPlaceholder gradientHeight={gradientHeight} />


	const flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse' | undefined = horizontal ? 'row' : 'column';

	return (
		<View style={{width: '100%', height: '100%', flexDirection: flexDirection}} onLayout={props.onLayout}>
			<MyScrollView
				overScrollMode={'always'}
				style={props.style}
				horizontal={horizontal}
				contentContainerStyle={{ width: '100%', alignItems: 'center', flexDirection: flexDirection}}
				showsVerticalScrollIndicator={true}
				{...props}
			>
				{children}
				{renderedPlaceholder}
			</MyScrollView>
			{renderedGradient}
		</View>
	)
}
