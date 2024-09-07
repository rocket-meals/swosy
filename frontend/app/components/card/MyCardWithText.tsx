// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {Heading, Text, useViewBackgroundColor, View} from '@/components/Themed';
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from '@/helper/color/MyContrastColor';
import {MyCard, MyCardDefaultBorderRadius, MyCardProps} from '@/components/card/MyCard';
import {useProjectColor} from "@/states/ProjectInfo";
import {ReactNode} from "react";

export type MyCardWithTextProps = {
    heading?: string | null | undefined,
	viewBackgroundColor?: string,
	separatorColor?: string,
	textColor?: string,
    text?: string,
} & MyCardProps

export type MyCardWithTextBottomWrapperProps = {
	children?: ReactNode | ReactNode[],
	noPadding?: boolean
} & MyCardWithTextProps


export const MyCardWithTextBottomWrapper = ({...props}: MyCardWithTextBottomWrapperProps) => {
	const projectColor = useProjectColor();
	const separatorColor = props.separatorColor || projectColor
	const defaultViewBackgroundColor = useViewBackgroundColor()

	let viewBackgroundColorForText = defaultViewBackgroundColor

	let lighterOrDarkerDefaultBackgroundColor = useLighterOrDarkerColorForSelection(defaultViewBackgroundColor)

	viewBackgroundColorForText = props.viewBackgroundColor || viewBackgroundColorForText


	const borderRaidus = props.borderRaidus || MyCardDefaultBorderRadius

	let renderedSeparator = null;
	if(!!projectColor){
		renderedSeparator = (
			<View style={{backgroundColor: separatorColor, width: '100%', height: 4}} />
		)
	}

	const paddingHorizontal = props.noPadding ? 0 : borderRaidus/2;
	const marginVertical = props.noPadding ? 0 : borderRaidus/2;


	return(
		<>
			{renderedSeparator}
			<View style={{backgroundColor: viewBackgroundColorForText, width: '100%', flexGrow: 1,
				borderBottomWidth: 1,
				borderLeftWidth: 1,
				borderRightWidth: 1,
				borderBottomEndRadius: borderRaidus,
				borderBottomStartRadius: borderRaidus,
				borderColor: lighterOrDarkerDefaultBackgroundColor,
			}}>
				<View style={{
					// px is padding left and right, py is padding top and bottom
					paddingHorizontal: paddingHorizontal, marginVertical: marginVertical,
				}}
					//px={borderRaidus/2} pt={2} pb={borderRaidus/2}
				>
					{props.children}
				</View>
			</View>
		</>
	)
}

export const MyCardWithTextBottom = ({heading, text, ...props}: MyCardWithTextProps) => {
	const defaultViewBackgroundColor = useViewBackgroundColor()

	let viewBackgroundColorForText = defaultViewBackgroundColor

	let lighterOrDarkerDefaultBackgroundColor = useLighterOrDarkerColorForSelection(defaultViewBackgroundColor)
	let textBoxColored = false;
	if(textBoxColored){
		viewBackgroundColorForText = lighterOrDarkerDefaultBackgroundColor
	}

	viewBackgroundColorForText = props.viewBackgroundColor || viewBackgroundColorForText
	let textContrastColor = useMyContrastColor(viewBackgroundColorForText)
	textContrastColor = props.textColor || textContrastColor

	let renderedHeading = null;
	if (heading) {
		renderedHeading = (
			<Heading style={{color: textContrastColor}}>
				{heading}
			</Heading>
		)
	}

	let renderedText = null;
	if (text) {
		renderedText = (
			<Text style={{color: textContrastColor}} my="$1.5" fontSize="$xs">
				{text}
			</Text>
		)
	}

	return(
		<MyCardWithTextBottomWrapper separatorColor={props.separatorColor} viewBackgroundColor={viewBackgroundColorForText}>
			{renderedHeading}
			{renderedText}
		</MyCardWithTextBottomWrapper>
	)
}

// define the button component
export const MyCardWithText = ({heading, text, ...props}: MyCardWithTextProps) => {
	let renderedBottomComponent = null;

	renderedBottomComponent = <MyCardWithTextBottom heading={heading} text={text} {...props} />
	if(props.bottomComponent){
		renderedBottomComponent = props.bottomComponent;
	}

	return (
		<MyCard {...props} bottomComponent={renderedBottomComponent} />
	)
}