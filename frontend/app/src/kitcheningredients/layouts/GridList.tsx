import React, {useEffect} from "react";
import {useBreakpointValue, View} from "native-base";
import {GridLayout} from "./GridLayout";

export const GridList = ({children, beakpointsColumns, paddingHorizontal, paddingVertical, divider,...props}: any) => {

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	let paddingVerticalValue = paddingVertical || "3%";
	let paddingHorizontalValue = paddingHorizontal || "2%";

	let renderedCards = [];
	if(!!children){
		let index = 0;
		for(let child of children){
			renderedCards.push(<View style={{paddingVertical: paddingVerticalValue, flex: 1}} key={index}>{child}</View>)
			index++;
		}
	}

	let defaultBreakpoints = {
		base: 2,
		sm: 3,
		md: 4,
		lg: 5,
		xl: 6,
	}
	let beakpoints = beakpointsColumns || defaultBreakpoints

	return(
		<View style={[{width: "100%"}, {...props?.style}]}>
			<GridLayout
				paddingVerticalValue={paddingVerticalValue}
				paddingHorizontalValue={paddingHorizontalValue}
				amountColoumn={useBreakpointValue(beakpoints)}
				divider={divider}
			>
				{renderedCards}
			</GridLayout>
		</View>
	)
}
