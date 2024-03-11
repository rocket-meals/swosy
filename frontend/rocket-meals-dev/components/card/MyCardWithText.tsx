// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {VStack} from '@gluestack-ui/themed';
import {Heading, Text, View, useViewBackgroundColor} from '@/components/Themed';
import { useMyContrastColor} from '@/helper/color/MyContrastColor';
import {MyCard, MyCardDefaultBorderRadius, MyCardProps} from '@/components/card/MyCard';

export type MyCardWithTextProps = {
    heading?: string,
    text?: string,
} & MyCardProps

// define the button component
export const MyCardWithText = ({heading, text, ...props}: MyCardWithTextProps) => {
	const viewBackgroundColor = useViewBackgroundColor()
	const textContrastColor = useMyContrastColor(viewBackgroundColor)

	const borderRaidus = props.borderRaidus || MyCardDefaultBorderRadius

	let renderedBottomComponent = null;

	let renderedHeading = null;
	if (heading) {
		renderedHeading = (
			<Heading style={{color: viewBackgroundColor}} size="sm">
				{heading}
			</Heading>
		)
	}

	let renderedText = null;
	if (text) {
		renderedText = (
			<Text style={{color: viewBackgroundColor}} my="$1.5"  fontSize="$xs">
				{text}
			</Text>
		)
	}

	renderedBottomComponent = (
		<View style={{backgroundColor: textContrastColor, width: '100%', height: '100%'}}>
			<VStack px={borderRaidus/2} pt={2} pb={borderRaidus/2}>
				{renderedHeading}
				{renderedText}
			</VStack>
		</View>
	)

	return (
		<MyCard {...props} bottomComponent={renderedBottomComponent} />
	)
}