import React, {FunctionComponent, useEffect, useState} from "react";
import {Input, ScrollView, Skeleton, Text, View} from "native-base";
import {Avatar, AvatarStyle, getAvatarProperties, getAvatarPropertiesDict} from "../../components/avatar/Avatar";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {Dimensions, TouchableOpacity} from "react-native";
import {Icon, useSynchedState} from "../../../kitcheningredients";
import {ColorSlider} from "../../components/colorPicker/ColorSlider";

export interface AppState{
	useSliders?: boolean,
	gradientSteps?: number,
	onChangeAvatar?: any,
	initialAvatar?: any,
	enabledAvatarStyles?: any,
}

export const getInitialAvatar = (avatarStyles) => {
	return {
		type: avatarStyles[0],
		values: {},
	}
}

export const AvatarsEditor: FunctionComponent<AppState> = (props) => {

	// corresponding componentDidMount
	useEffect(() => {
	}, [props])

	let avatarStyles = props?.enabledAvatarStyles || Object.keys(AvatarStyle);
	let amountAvatarStyles = avatarStyles.length
	if(amountAvatarStyles===0){
		return <Skeleton />
	}


	let initialAvatar = props?.initialAvatar || getInitialAvatar(avatarStyles);

	const [avatarString, setAvatarString] = useState(JSON.stringify(initialAvatar));
	let parsedAvatar = JSON.parse(avatarString);

	const avatarStyle = parsedAvatar.type;
	let avatarStyleIndex = getAvatarStyleIndex();
	const parsedAvatarProps = parsedAvatar.values;


	const propetries = getAvatarPropertiesDict(avatarStyle)
	const propertyKeys = Object.keys(propetries)
	const rawProperties = getAvatarProperties(avatarStyle);


	function countPositionInList(list, value){
		let index = 0;
		for(let content of list){
			if(content===value){
				return index;
			}
			index++;
		}
		return index;
	}

	function getAvatarStyleIndex(){
		return countPositionInList(avatarStyles, avatarStyle);
	}

	function getNextIndex(amountTotal, currentIndex, step){
		let result = (amountTotal+((currentIndex+step)%amountTotal))%amountTotal;//make sure to be in [0, amountAvatarStyles]
		return result
	}

	async function handleAvatarChange(parsedAvatar){
		if(!!props.onChangeAvatar){
			await props.onChangeAvatar(parsedAvatar);
		}
		setAvatarString(JSON.stringify(parsedAvatar))
	}

	function changeAvatarStyle(step: number){
		let nextIndex = getNextIndex(amountAvatarStyles, avatarStyleIndex, step)
		let nextStyle = avatarStyles[nextIndex];

		parsedAvatar.type = nextStyle;
		parsedAvatar.values = {};
		if(nextStyle===AvatarStyle.bottts){
			parsedAvatar.values.seed = "Test";
		}

		handleAvatarChange(parsedAvatar)
	}

	function setAvatarProps(parsedAvatarProps){
		parsedAvatar.values = parsedAvatarProps;
		handleAvatarChange(parsedAvatar)
	}

	function renderSwitchIcon(forward: boolean, onPress: any){
		let step = forward ? 1 : -1;
		let iconName = forward ? "chevron-right" : "chevron-left"

		let padding = 10;

		return(
			<ViewPixelRatio>
				<TouchableOpacity style={[{padding: padding, backgroundColor: "orange"}]} onPress={() => {
					onPress(step);
				}}>
					<Icon name={iconName} />
				</TouchableOpacity>
			</ViewPixelRatio>
		)
	}

	function renderOptionRow(title, changeFunction, value){
		return(
			<View style={{justifyContent: "center", alignItems: "center", flexDirection: "row", width: "100%"}}>
				<View style={{flex: 1, justifyContent: "center", alignItems: "center"}}><Text>{title+": "}</Text></View>
				{renderSwitchIcon(false, changeFunction)}
				<View style={{flex: 2, justifyContent: "center", alignItems: "center"}}><Text>{value}</Text></View>
				{renderSwitchIcon(true, changeFunction)}
			</View>
		)
	}


	function changeAvatarProp(property, itemList, isArray, step){
		let rawPropertyContent = rawProperties[property];
		let amountEnums = itemList.length;
		let searchValue = parsedAvatarProps[property]
		if(isArray && !!searchValue){
			searchValue = searchValue[0];
		}

		let index = countPositionInList(itemList, searchValue);
		let nextIndex = getNextIndex(amountEnums, index, step);
		let value = itemList[nextIndex];
		if(isArray){
			parsedAvatarProps[property] = [value];
		} else {
			parsedAvatarProps[property] = value;
		}
		setAvatarProps(parsedAvatarProps);
	}

	function renderAvatarProperty(property, isArray){
		let rawPropertyContent = rawProperties[property];
		let title = rawPropertyContent?.title;
		let value = "";
		let itemList = [];
		if(rawPropertyContent?.enum){
			itemList = rawPropertyContent.enum;
		}
		if(rawPropertyContent?.items && rawPropertyContent?.items?.enum){
			itemList = rawPropertyContent?.items?.enum;
		}

		if(!!parsedAvatarProps[property]){
			value = parsedAvatarProps[property];
		}

		return (
			renderOptionRow(title, changeAvatarProp.bind(null, property, itemList, isArray), value)
		)
	}

	function renderAvatarSeedProperty(){
		let property = "seed";
		let title = "Seed";

		let value = "";
		if(!!parsedAvatarProps[property]){
			value = parsedAvatarProps[property];
		}

		return (
			<View style={{justifyContent: "center", alignItems: "center", flexDirection: "row", width: "100%"}}>
				<View style={{flex: 1, justifyContent: "center", alignItems: "center"}}><Text>{title+": "}</Text></View>
				<View style={{flex: 2, justifyContent: "center", alignItems: "center"}}><Input value={value} style={{width: "100%"}} onChangeText={(text) => {
					parsedAvatarProps[property] = text;
					setAvatarProps(parsedAvatarProps);
				}} />
				</View>
			</View>
		)
	}

	function renderAvatarColorProperty(property, isArray){
		let rawPropertyContent = rawProperties[property];
		let title = rawPropertyContent?.title;

		let value = "";
		if(!!parsedAvatarProps[property]){
			value = parsedAvatarProps[property];
		}

		const useBoxes = !props?.useSliders;
		let gradientSteps = useBoxes ? 6 : undefined;
		if(props?.gradientSteps){
			gradientSteps = props.gradientSteps;
		}

		return (
			<View style={{justifyContent: "center", alignItems: "center", flexDirection: "row", width: "100%"}}>
				<View style={{flex: 1, justifyContent: "center", alignItems: "center"}}><Text>{title+": "}</Text></View>
				<View style={{flex: 2, flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
					<View style={{width: 20, height: 20, backgroundColor: parsedAvatarProps[property], borderColor: "black", borderWidth: 1}}>

					</View>
					<ColorSlider useBoxes={useBoxes} gradientSteps={gradientSteps} advanced={true} initialColor={"#B78158"} onChangeHexColor={(color) => {
						if(isArray){
							parsedAvatarProps[property] = [color];
						} else {
							parsedAvatarProps[property] = color;
						}
						setAvatarProps(parsedAvatarProps);
					}} />
				</View>
			</View>
		)
	}

	function renderAvatarProperties(){
		let output = [];
		if(avatarStyle===AvatarStyle.bottts){
			output.push(renderAvatarSeedProperty())
		}
		for(let property of propertyKeys){
			let rawPropertyContent = rawProperties[property];
			let type = rawPropertyContent?.type;
			let isArray = type==="array";
			if(type==="boolean"){
				//no interest in these
				continue;
			}
			if(property.includes("Probability") || property.includes("Chance")){
				//we dont want any of chances
				continue;
			}

			let isColor = false;
			if(rawPropertyContent?.anyOf){
				isColor = true;
			}
			if(type==="array" && rawPropertyContent?.items?.anyOf){
				/**
				 * {"title":"Hair Color","type":"array","items":{"anyOf":[{"typ...
				 */
				isColor = true;
			}

			if(isColor){
				output.push(renderAvatarColorProperty(property, isArray));
				continue;
			}
			if(type==="string" || type==="array" || type==="integer"){
				output.push(renderAvatarProperty(property, isArray))
				continue;
			}
			if(rawPropertyContent?.anyOf){
				output.push(renderAvatarColorProperty(property));
				continue;
			}

			output.push(<View>
				<Text>{property+": "+JSON.stringify(rawPropertyContent, null, 2)}</Text>
			</View>)
		}
		return output;
	}

	return(
		<>
			{renderOptionRow("avatarStyle", changeAvatarStyle, avatarStyle)}
			<View style={{justifyContent: "center", alignItems: "center", flexDirection: "row", width: "100%"}}>
				<View style={{width: 300, height: 400, justifyContent: "center"}}>
					<Avatar avatar={parsedAvatar} />
				</View>
			</View>
			<View style={{width: "100%", flex: 1}}>
				{renderAvatarProperties()}
			</View>
		</>
	)
}
