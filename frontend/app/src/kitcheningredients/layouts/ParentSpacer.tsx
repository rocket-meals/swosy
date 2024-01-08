import {View} from "native-base";
import React from "react";

export const ParentSpacer = (props) => {

	const children = props?.children?.length ? props.children : [props.children]; //if only one child pass into array

	const space = props?.style?.space || props?.space;
	return (
		// @ts-ignore
		<View
			style={[{
				flex: 1,
				flexDirection: props?.style?.direction || props?.direction,
			}, props?.style]}>
			{children.map((child, index, arr) => (
				<>
					{child}
					{index < arr.length - 1 && <View style={{width: space, height: space}} />}
				</>
			))}
		</View>
	)

}
