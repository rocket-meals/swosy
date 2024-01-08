// @ts-nocheck
import React, {FunctionComponent, useContext} from 'react';
import {Text, Box, Button, Heading, HStack, useBreakpointValue, useColorMode, View,} from 'native-base';
import {Layout} from "./Layout";

export const BreakPointLayout = ({
	children,
	navigation,
	title,
	doclink,
	navigateTo,
	_status,
	_hStack,
	...props
}: any) => {

	let widthValues = !!props.breakPointWidthValues ? props.breakPointWidthValues : Layout.getWidthValues();
	const boxWidth = useBreakpointValue(widthValues);

	return (
			<Box
				style={{padding: 0, flex: 1, margin: 0 ,alignItems: "flex-start"}}
				{...props}
				flex={1}
				px={0}
				mx="auto"
				pt={navigation ? '70px' : 0}
				width={boxWidth}
			>
					{children}
			</Box>
	);

	// { base: '100%', lg: '768px', xl: '1080px' }
};
