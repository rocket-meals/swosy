// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {Box, useColorModeValue, useTheme} from "native-base";
import {IBoxProps} from "native-base/lib/typescript/components/primitives/Box/types";

export function useThemedShade(level){
  const theme = useTheme();
  const colors = theme?.colors;

  const maxLevel = 9;
  const minLevel = 0;
  level = Math.min(maxLevel, Math.max(minLevel, level))

  function getShadeByLevel(level){
    if(level===0) return 50;
    return level*100;
  }

  let themeLevel = useColorModeValue(level, maxLevel-level)
  let _myThemeShade = getShadeByLevel(themeLevel);
  let colorGroup = useColorModeValue('coolGray', 'blueGray');
  return colors[colorGroup][""+_myThemeShade]
}

export interface AppState {
	_shadeLevel?: number
	activeOnHover?: boolean
}
export const MyThemedBox: FunctionComponent<AppState & IBoxProps> = (props) => {

	let level = props._shadeLevel || 0;
	let _myThemeShade = useThemedShade(level);

	const childrenWithProps = React.Children.map(props.children, child => {
		// Checking isValidElement is the safe way and avoids a typescript
		// error too.
		if (React.isValidElement(child)) {
			// @ts-ignore
			return React.cloneElement(child, { _shadeLevel: level+1 });
		}
		return child;
	});

	return(
		<Box
			 bg={_myThemeShade}
			 {...props}
		>
			{childrenWithProps}
		</Box>
	)

}
