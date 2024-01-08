// @ts-nocheck
import React, {FunctionComponent} from "react";
import {ScrollView, ScrollViewProps} from 'react-native';
import {ShowMoreGradient} from "./ShowMoreGradient";
import {View} from "native-base";
import {ShowMoreGradientPlaceholder} from "./ShowMoreGradientPlaceholder";

interface AppState {
	hideGradient?: boolean
  scrollViewProps?: ScrollViewProps
}
export const ScrollViewWithGradient: FunctionComponent<AppState & ScrollViewProps> = (props) => {

  let horizontal = props?.scrollViewProps?.horizontal;

	let hideGradient = props.hideGradient;
	let renderedGradient = hideGradient ? null : <ShowMoreGradient horizontal={horizontal} />
  let renderedPlaceholder = hideGradient ? null : <ShowMoreGradientPlaceholder />


	let flexDirection = horizontal ? "row" : "column";

	return(
		<View style={{width: "100%", flex: 1, flexDirection: flexDirection}} onLayout={props.onLayout}>
			<ScrollView
				style={props.style}
				contentContainerStyle={{ width: '100%', alignItems: "center", ...props?.contentContainerStyle }}
				showsVerticalScrollIndicator={true}
        {...props.scrollViewProps}
			>
				{props.children}
        {renderedPlaceholder}
			</ScrollView>
			{renderedGradient}
		</View>
	)
}
