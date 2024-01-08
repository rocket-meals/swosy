// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Button, Text} from "native-base";
import {IButtonProps} from "native-base/src/components/primitives/Button/types";
import {IBoxProps} from "native-base/src/components/primitives/Box/index";
import {TransparentButton} from "./TransparentButton";

export const TransparentTextButton: FunctionComponent<IButtonProps & IBoxProps> = ({children, accessibilityLabel, ...props}) => {

	return (
		<TransparentButton accessibilityLabel={accessibilityLabel} {...props}>
			<Text {...props}>
				{children}
			</Text>
		</TransparentButton>
	)
}
