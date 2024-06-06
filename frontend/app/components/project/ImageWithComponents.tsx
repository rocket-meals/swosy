import DirectusImage, {DirectusImageProps} from '@/components/project/DirectusImage';
import {View} from '@/components/Themed';
import React, {ReactNode} from 'react';
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {FoodFeedbackRating} from "@/components/foodfeedback/FoodRatingDisplay";
import {MyButton} from "@/components/buttons/MyButton";
import {IconNames} from "@/constants/IconNames";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";

export type ImageWithComponentProps = {
  image: DirectusImageProps,
  accesibilityLabel: string,
  bottomRightComponent?: ReactNode,
  topRightComponent?: ReactNode,
  bottomLeftComponent?: ReactNode,
  topLeftComponent?: ReactNode,
  innerPadding?: number,
	onPress?: () => void,
}

export default function ImageWithComponents(props: ImageWithComponentProps) {
	const innerPadding = props.innerPadding ?? 0;

	const onPress = props.onPress;

	let image = <DirectusImage {...props.image} style={{width: '100%', height: '100%'}}/>

	if (onPress) {
		image = (
			<MyTouchableOpacity style={{width: '100%', height: "100%"}} accessibilityRole={MyAccessibilityRoles.ImageButton} accessibilityLabel={props.accesibilityLabel} onPress={onPress} >
				{image}
			</MyTouchableOpacity>
		)
	}

	return (
		<View style={{width: '100%', height: '100%'}}>
			{image}
			<View style={{
				position: 'absolute',
				bottom: 0,
				right: 0,
				padding: innerPadding,
			}}
			>
				{props.bottomRightComponent}
			</View>
			<View style={{
				position: 'absolute',
				top: 0,
				right: 0,
				padding: innerPadding,
			}}
			>
				{props.topRightComponent}
			</View>
			<View style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				padding: innerPadding,
			}}
			>
				{props.bottomLeftComponent}
			</View>
			<View style={{
				position: 'absolute',
				top: 0,
				left: 0,
				padding: innerPadding,
			}}
			>
				{props.topLeftComponent}
			</View>
		</View>
	)
}