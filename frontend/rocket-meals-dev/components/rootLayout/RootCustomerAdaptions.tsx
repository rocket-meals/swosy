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

	return 	<>
		{props.children}
	</>
}