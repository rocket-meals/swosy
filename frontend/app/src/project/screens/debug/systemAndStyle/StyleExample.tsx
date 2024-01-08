import React, {useEffect, useState} from "react";
import {Box, Divider, Slider, Stack, View, Text} from "native-base";
import {PixelRatio} from "react-native";
import {ViewPixelRatio} from "../../../helper/ViewPixelRatio";
import {Icon} from "../../../../kitcheningredients";

export const StyleExample = (props) => {

	const initialValue = 70;

	let pixelratio = PixelRatio.get();

	const [onChangeValue, setOnChangeValue] = React.useState(initialValue);
	const [onChangeEndValue, setOnChangeEndValue] = React.useState(initialValue);

	function renderSlider(){
		return (
			<Box alignItems="center" w="100%">
				<Stack space={4} alignItems="center" w="75%">
					<Text textAlign="center">onChangeValue - {onChangeValue}</Text>
					<Text textAlign="center">onChangeEndValue - {onChangeEndValue}</Text>
					<Slider defaultValue={initialValue} colorScheme="cyan" onChange={v => {
						setOnChangeValue(Math.floor(v));
					}} onChangeEnd={v => {
						v && setOnChangeEndValue(Math.floor(v));
					}}>
						<Slider.Track>
							<Slider.FilledTrack />
						</Slider.Track>
						<Slider.Thumb />
					</Slider>
				</Stack>
			</Box>
		);
	}

	let value = onChangeValue

	function renderRaw(){
		return(
			<View style={{width: "100%", backgroundColor: "gray", padding: value*0.1}}><Text>{"Raw"}</Text></View>
		)
	}

	function renderPixelRatio(){
		return(
			<ViewPixelRatio style={{width: "100%", backgroundColor: "gray", padding: value*0.1}}><Text>{"PixelRatio"}</Text></ViewPixelRatio>
		)
	}

	function renderPercentage(){
		return(
			<View style={{width: "100%", backgroundColor: "gray", padding: value*0.1+"%"}}><Text>{"Percent"}</Text></View>
		)
	}

	function renderEm(){
		return(
			<View style={{width: "100%", backgroundColor: "gray", padding: value*0.1+"em"}}><Text>{"Em (only web working)"}</Text></View>
		)
	}

	function renderRem(){
		return(
			<View style={{width: "100%", backgroundColor: "gray", padding: value*0.1+"rem"}}><Text>{"Rem (only web working)"}</Text></View>
		)
	}

	function renderPx(){
		return(
			<View style={{width: "100%", backgroundColor: "gray", padding: value*0.1+"px"}}><Text>{"Px (not working?)"}</Text></View>
		)
	}

	return(
		<View style={{width: "100%"}}>
			{renderSlider()}
			<View style={{width: "100%"}}>
				{renderRaw()}
				<Divider />
				{renderPixelRatio()}
				<Divider />
				{renderPercentage()}
				<Divider />
				{renderEm()}
				<Divider />
				{renderRem()}
				<Divider />
				{renderPx()}
			</View>
			<View>
				<Text>{"Align and FlexDirection"}</Text>
				<View style={{width: "100%"}}>
					<Text>{"flexDirection: row, alignItems Center"}</Text>
					<View style={{flexDirection: "row", width: "100%", alignItems: "center"}}>
						<View style={{flex: 1, backgroundColor: "orange"}}>
							<Icon name={"account"} />
						</View>
						<View style={{flex: 1, backgroundColor: "red"}}>
							<Text>{"Account Icon"}</Text>
						</View>
					</View>
					<Text>{"flexDirection: row, justifyContent Center"}</Text>
					<View style={{flexDirection: "row", width: "100%", justifyContent: "center"}}>
						<View style={{flex: 1, backgroundColor: "orange"}}>
							<Icon name={"account"} />
						</View>
						<View style={{flex: 1, backgroundColor: "red"}}>
							<Text>{"Account Icon"}</Text>
						</View>
					</View>
					<Text>{"flexDirection: column, alignItems Center"}</Text>
					<View style={{flexDirection: "column", width: "100%", alignItems: "center"}}>
						<View style={{flex: 1, backgroundColor: "orange"}}>
							<Icon name={"account"} />
						</View>
						<View style={{flex: 1, backgroundColor: "red"}}>
							<Text>{"Account Icon"}</Text>
						</View>
					</View>
					<Text>{"flexDirection: column, justifyContent Center"}</Text>
					<View style={{flexDirection: "column", width: "100%", justifyContent: "center"}}>
						<View style={{flex: 1, backgroundColor: "orange"}}>
							<Icon name={"account"} />
						</View>
						<View style={{flex: 1, backgroundColor: "red"}}>
							<Text>{"Account Icon"}</Text>
						</View>
					</View>
				</View>

			</View>
		</View>
	)
}
