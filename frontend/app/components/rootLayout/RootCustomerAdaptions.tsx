import React from 'react';
import {useProjectColor} from "@/states/ProjectInfo";
import {View} from "@/components/Themed";

export interface RootCustomerAdaptionsProps {
	children?: React.ReactNode;
}
export const RootCustomerAdaptions = (props: RootCustomerAdaptionsProps) => {
	const projectColor = useProjectColor();

	/**
	 * Implement customer specific adaptions here
	 */

	return 	 <View style={{
		width: '100%',
		height: '100%',
		flexDirection: 'row',
	}}>
		<View style={{
			width: 5,
			height: "100%",
			backgroundColor: projectColor,
		}} />
		<View style={{
			flexGrow: 1,
			flex: 1
		}}>
			{props.children}
		</View>
	</View>
}
