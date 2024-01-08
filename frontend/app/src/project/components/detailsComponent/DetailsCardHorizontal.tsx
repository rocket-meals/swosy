import React, {FunctionComponent, useEffect, useState} from "react";
import {
	KitchenSkeleton,
	MyThemedBox,
} from "../../../kitcheningredients";
import {View, Text} from "native-base";
import {TouchableOpacity} from "react-native";
import {StringHelper} from "../../helper/StringHelper";
import {ParentDimension} from "../../helper/ParentDimension";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";
import {MyTouchableOpacityForNavigation} from "../buttons/MyTouchableOpacityForNavigation";

interface AppState {
	title: string,
	teaser: string,
	bottomText: string,
	image: any,
	ignoreImage?: boolean,
	onPress: any,
	amountOfLinesTitle: number,
	loading: boolean,
}
export const DetailsCardHorizontal: FunctionComponent<AppState> = (props) => {

	const [dimension, setDimension] = useState({width: undefined, height: undefined})
	let borderRadius = dimension.width ? Math.round(dimension.width*0.02) : 0;
	const imageHeight = dimension.height ? dimension.height : 0;
	const imageWidth = imageHeight;

	const title = props?.title;

	const dimensionSet = !!dimension?.height && !!dimension.width

	const amountOfLinesTitle = props?.amountOfLinesTitle || 3;

	/**
	 <View style={{width: "100%", flex: 1}}>
	 <MyThemedBox key={"foodcard_bottom"} _shadeLevel={3}  style={{width: "100%", flex: 1, padding: 10}}>
	 <Text>{"News ID: "+resource.id}</Text>
	 </MyThemedBox>
	 </View>
	 */

	function renderImage(){
		if(props?.ignoreImage){
			return null;
		}

		return(
			<View style={{width: imageWidth, height: imageHeight}}>
				{props?.image}
			</View>
		)
	}

	function renderTitle(){
		let amountLinesForTitle = amountOfLinesTitle;

		let teaserText = props?.teaser;

		return (
			<View style={{flexDirection: "row"}}>
				{StringHelper.renderZeroSpaceHeight(amountOfLinesTitle)}
				<Text numberOfLines={amountLinesForTitle} selectable={true}><Text bold={true} selectable={true}>{title+"\n"}</Text><Text fontSize={"sm"} bold={false} selectable={true}>{teaserText}</Text></Text>
			</View>
		)
	}

	function renderDate(){
		return(
			<View style={{flexDirection: "row"}}>
				<Text fontSize={"sm"} italic={true} selectable={true}>{props?.bottomText}</Text>
			</View>
		)
	}

	function renderSkeleton(){
		if(!dimensionSet || props?.loading){
			return (
				<View style={{width: "100%", height: "100%", position: "absolute"}}>
					<KitchenSkeleton flex={1} />
				</View>
			)
		}
	}

	function renderCard(){
		let paddingRight = 10;
		if(!!borderRadius){
			paddingRight+=borderRadius;
		}
		return(
			<MyThemedBox _shadeLevel={3} style={{width: "100%"}}>
				<MyTouchableOpacityForNavigation accessibilityLabel={title} style={{flexGrow: 1, flex: 1}} onPress={() => {
					if(props?.onPress){
						props?.onPress();
					}
				}}>
					<View style={{flexDirection: "row", width: "100%", flex: 1, paddingRight: paddingRight}}>
						{renderImage()}
						<View style={{paddingLeft: 10, flexDirection: "column", flexGrow: 1, flex: 1}}>
							<View style={{width: "100%", flexDirection: "row"}}>
								<View style={{flexGrow: 1, flex: 1}}>
									{renderTitle()}
									{props?.children}
								</View>
								<View style={{paddingLeft: 10}}>
									{props?.topRight}
								</View>
							</View>
							<View style={{width: "100%", alignItems: "flex-end", flex: 1, justifyContent: "flex-end"}}>
								{renderDate()}
							</View>
						</View>
					</View>
				</MyTouchableOpacityForNavigation>
				{renderSkeleton()}
			</MyThemedBox>
		)
	}

	return(
		<View style={{width: "100%"}}>
			<ParentDimension setDimension={async (x, y, width, height) => {
				setDimension({
					width: width,
					height: height
				})
			}} >
				<ViewPercentageBorderradius style={{borderRadius: "2%", width: "100%", flex: 1, overflow: "hidden"}}>
					{renderCard()}
				</ViewPercentageBorderradius>
			</ParentDimension>
		</View>
	)

}
