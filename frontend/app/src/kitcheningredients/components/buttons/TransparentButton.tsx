// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Button, Text, Tooltip} from "native-base";
import {IButtonProps} from "native-base/src/components/primitives/Button/types";
import {IBoxProps} from "native-base/src/components/primitives/Box/index";

export const TransparentButton: FunctionComponent<IButtonProps & IBoxProps> = ({children, accessibilityLabel, ...props}) => {


	return (
	  <Tooltip label={accessibilityLabel} >
      <Button accessibilityLabel={accessibilityLabel} minWidth={154} bgColor={"#00000000"} {...props}>
        {children}
      </Button>
    </Tooltip>
	)
}
