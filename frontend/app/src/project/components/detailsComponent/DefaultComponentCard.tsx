import React, {FunctionComponent, useState} from "react";
import {useBreakpointValue, View, Text} from "native-base";
import {StringHelper} from "../../helper/StringHelper";
import {MyThemedBox, useMyContrastColor, useThemedShade} from "../../../kitcheningredients";
import {Dimensions, TouchableOpacity} from "react-native";
import Rectangle from "../../helper/Rectangle";
import {ParentDimension} from "../../helper/ParentDimension";
import {DetailsCardBorder} from "./DetailsCardBorder";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

export interface AppState{
	accessibilityLabel: string
	borderColor?: string,
	liked?: boolean,
	disliked?: boolean,
	onPressTop?: () => any,
	small?: boolean
	positionBottom?: boolean
	renderBottom?: (backgroundColor, textColor) => any,
	renderTop?: (width) => any,
	renderTopForeground?: (width) => any,
	numberOfLines?: number,
	variableHeight?: boolean,
}
export const DefaultComponentCard: FunctionComponent<AppState> = (props) => {

	const [dimension, setDimension] = useState({x: undefined, y: undefined, width: undefined, height: undefined});
	const bottomShadeColor = useThemedShade(3);
	const textColor = useMyContrastColor(bottomShadeColor);

	/**
	 * Returns true if the screen is in portrait mode
	 */
	const isPortrait = () => {
		const dim = Dimensions.get('screen');
		return dim.height >= dim.width;
	};

	const percentBorderRadius = 0.05;
	const percentBorderRadiusString = percentBorderRadius*100+"%";

	let amountOfLines = props?.numberOfLines || 3;

	const small = props?.small || false;

	let defaultPortraitBreakpoints = {
		base: "80%",
		sm: "50%",
		md: "40%",
		lg: "30%",
		xl: "30%",
	}
	let defaultLandscapeBreakpoints = {
		base: "60%",
		sm: "50%",
		md: "50%",
		lg: "30%",
		xl: "30%",
	}
	let beakpoints = isPortrait() ? defaultPortraitBreakpoints : defaultLandscapeBreakpoints
	let width = useBreakpointValue(beakpoints)

	if(small){
		width = "100%"
	}

	function renderTopForeground(){

	}

	function renderTopPart(){

		let renderedTop = null;
		if(props.renderTop){
			renderedTop = props.renderTop(dimension?.width);
		}

		const variableHeight = props?.variableHeight || false;
		const content = (
			<MyTouchableOpacity
				accessibilityRole={AccessibilityRoles.imagebutton}
				accessibilityLabel={props?.accessibilityLabel}
				style={{
				width: "100%",
				height: "100%",
				flex: 1,
				backgroundColor: "transparent"}} onPress={() => {
				if(props?.onPressTop){
					props.onPressTop()
				}
			}}>


					{renderedTop}
	</MyTouchableOpacity>
		)

		let heightHolder = null;

		if(variableHeight){
			heightHolder = content;
		} else {
			heightHolder = (
				<Rectangle key={"foodcard_top"}>
					{content}
				</Rectangle>
			)
		}

		const foreground = props?.renderTopForeground ? props.renderTopForeground(dimension?.width) : null;
		let renderedForeground = null;

		let borderRadiusStyle = {
			borderTopRightRadius: percentBorderRadiusString,
			borderTopLeftRadius: percentBorderRadiusString,
		}
		if(props?.positionBottom){
			borderRadiusStyle = {
				borderBottomRightRadius: percentBorderRadiusString,
				borderBottomLeftRadius: percentBorderRadiusString,
			}
		}

		return (
			<View style={{width: width, backgroundColor: "transparent"}}>
				<ParentDimension setDimension={async (x, y, width, height) => {
					setDimension({x: x, y: y, width: width, height: height})
				}} >
					<ViewPercentageBorderradius style={{
						width: "100%",
						height: "100%",
						backgroundColor: "gray",
						...borderRadiusStyle,
						flex: 1, overflow: "hidden"
					}}>
					{heightHolder}
					{renderedForeground}
					{foreground}
					{renderBorderIfBig()}
					</ViewPercentageBorderradius>
						{/* TODO: weitere Bilder slider */}
				</ParentDimension>
			</View>
		)
	}

	function renderBottomPart(){

		let bottomPartStyle = {
			flexDirection: "row",
			paddingVertical: "1%",
			paddingHorizontal: "3%",
			backgroundColor: bottomShadeColor,
		}

		let outerBottomStyle = {
			overflow: "hidden",
		}

		if(small){
			let outerBottomRoundStyle = {
				borderBottomRightRadius: percentBorderRadiusString,
				borderBottomLeftRadius: percentBorderRadiusString
			}
			if(props?.positionBottom){
				outerBottomRoundStyle = {
					borderTopRightRadius: percentBorderRadiusString,
					borderTopLeftRadius: percentBorderRadiusString
				}
			}
			outerBottomStyle = {...outerBottomStyle, ...outerBottomRoundStyle}
		}

		let renderedBottom = null;
		if(props.renderBottom){
			renderedBottom = props.renderBottom(bottomShadeColor, textColor);
		}

		return(
			<ViewPercentageBorderradius style={outerBottomStyle}>
				<View key={"food_name"} style={[bottomPartStyle]}>
					{StringHelper.renderZeroSpaceHeight(amountOfLines)}
					<View style={{flexDirection: "column", flex: 1}}>
						{renderedBottom}
					</View>
				</View>
			</ViewPercentageBorderradius>
		)
	}

	function renderBorderIfBig(){
		if(!small){
			return <DetailsCardBorder hideBottomPartAndQuickRate={true} borderRadius={percentBorderRadiusString} like={props?.liked} dislike={props?.disliked}  />
		}
	}

	function renderBorderIfSmall(){
		if(small){
			return <DetailsCardBorder hideBottomPartAndQuickRate={false} borderRadius={percentBorderRadiusString} like={props?.liked} dislike={props?.disliked} />
		}
	}

	return(
		<>
			<View style={{width: "100%"}}>
				{renderTopPart()}
				{renderBottomPart()}
				{renderBorderIfSmall()}
			</View>
		</>
	)
}
