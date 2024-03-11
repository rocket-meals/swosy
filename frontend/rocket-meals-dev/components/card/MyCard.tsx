// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {Box} from '@gluestack-ui/themed';
import { View} from '@/components/Themed';

export type MyCardProps = {
    onPress?: () => void,
    children?: React.ReactNode,
    borderRaidus?: number,
    topComponent?: React.ReactNode,
    bottomComponent?: React.ReactNode,
    style?: any,
}

export const MyCardDefaultBorderRadius = 10;

// define the button component
export const MyCard = ({topComponent, bottomComponent, children, style}: MyCardProps) => {
	const borderRaidus = MyCardDefaultBorderRadius

	let renderedTopComponent = null;
	if (topComponent) {
		renderedTopComponent = topComponent;
	}

	let renderedBottomComponent = null;
	if (bottomComponent) {
		renderedBottomComponent = bottomComponent;
	}


	const usedStyle = {...style};

	usedStyle.height = usedStyle?.height || '100%'
	usedStyle.width = usedStyle?.width || '100%'
	usedStyle.flex = usedStyle?.flex || 1

	return (
		<View style={usedStyle}>
			<Box
				maxWidth="100%"
				maxHeight="100%"
				width="100%"
				height="100%"
				borderColor={'transparent'}
				borderRadius={borderRaidus}
				borderWidth="$1"
				overflow="hidden"
				$dark-bg="$backgroundDark900"
				$dark-borderColor="$borderDark800"
			>
				{renderedTopComponent}
				{renderedBottomComponent}
				{children}
			</Box>
		</View>
	)
}