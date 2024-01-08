import React, {FunctionComponent, useState} from "react";
import {Text, View} from "native-base";
import {AccessibilityRole, TouchableOpacity} from "react-native";
import {SettingsRowInner} from "../settings/SettingsRowInner";
import {SettingsSpacer} from "../settings/SettingsSpacer";
import {ColorHelper} from "../../helper/ColorHelper";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

export type DetailsComponentMenuType = {
	color?: string,
	activeColor?: string,
	onPress?: () => Promise<boolean | undefined>, // an async onPress function that returns a boolean or undefined
	element?: JSX.Element,
	menuButtonContent?: any | string,
	renderContent?: (backgroundColor, textColor) => any
	renderIcon?: (backgroundColor, textColor) => any
	icon: JSX.Element,
	amount?: number,
}
export interface AppState{
	// menus are a dict with DetailsComponentMenuType as value and a string as key
	menus: Record<string, DetailsComponentMenuType>,
	spacer?: any,
	defaultMenuKey?: string,
	defaultColor?: string,
	defaultActiveColor?: string,
	defaultTextColor?: string,
	defaultActiveTextColor?: string,
	hideSelection?: boolean,
	style?: any,
}
export const DetailsComponentMenus: FunctionComponent<AppState> = (props) => {

	const defaultColor = props?.defaultColor || ColorHelper.useProjectColor();
	let defaultActiveColor = props?.defaultActiveColor || ColorHelper.useDefaultDarkenColor(defaultColor)
	const defaultTextColor = props?.defaultTextColor || ColorHelper.useContrastColor(defaultColor);
	const defaultActiveTextColor = props?.defaultActiveTextColor || ColorHelper.useContrastColor(defaultActiveColor)

	if(props?.hideSelection) {
		defaultActiveColor = defaultColor;
	}

	const menus = props.menus || {};
	const menuKeys = Object.keys(menus);
	const defaultMenuKey = props?.defaultMenuKey || menuKeys[0];

	const [selectedMenuKey, setSelectedMenuKey] = useState(defaultMenuKey);
	let selectedMenu = menus[selectedMenuKey];
	let element = selectedMenu?.element;

	function renderMenuButton(menuKey){
		let menu = menus[menuKey];
		let isSelected = selectedMenuKey === menuKey;

		let color = menu?.color || defaultColor;
		let activeColor = menu?.activeColor || defaultActiveColor;

		const onPressMenu = menu?.onPress;

		let amount = menu?.amount;
		let amountText = "";
		if(amount!==undefined){
			amountText = " ("+amount+")";
		}



		let additionalStyle = {};
		let usedTextColor = defaultTextColor;
		if(isSelected && !props?.hideSelection){
			let selectedStyle = {
				borderWidth: 2,
				borderColor: "white",
				backgroundColor: activeColor,
			}
			usedTextColor = defaultActiveTextColor;
			additionalStyle = selectedStyle;
		}

		let buttonContent = menu?.menuButtonContent;
		if(menu?.renderContent){
			buttonContent = menu.renderContent(activeColor, usedTextColor);
		}

		let icon = menu?.icon;
		let renderedIcon = null;
		if(!!icon){
			renderedIcon = <Text color={usedTextColor}>{icon}</Text>;
		}
		if(menu?.renderIcon){
			renderedIcon = menu.renderIcon(activeColor, usedTextColor);
		}


		return(
			<View style={{marginHorizontal: 5, marginVertical: 5}}>
				<TouchableOpacity
					accessibilityState={{expanded: isSelected}}
					accessibilityRole={AccessibilityRoles.tab}
					style={[{ borderColor: "transparent", borderWidth: 2,justifyContent: "center", flexDirection: "row", backgroundColor: color, borderRadius: 10}, additionalStyle]}
								  onPress={async () => {
								  	let proceed = true;
								  	if(onPressMenu){
								  		let result = await onPressMenu();
								  		if(result!==undefined && result!==null){
								  			proceed = result;
								  		}
									}
								  	if(proceed){
										setSelectedMenuKey(menuKey)
									}
								  }}
				>
					<SettingsRowInner leftContent={<View style={{flexDirection: "row", alignItems: "center"}}>{buttonContent}<Text color={usedTextColor}>{amountText}</Text></View>} leftIcon={renderedIcon} rightIcon={null} />
				</TouchableOpacity>
			</View>
		)
	}

	function renderMenuButtons(){
		let menuKeys = Object.keys(menus);
		let output = [];
		for(let menuKey of menuKeys){
			if(menus[menuKey]){
				output.push(renderMenuButton(menuKey))
			}
		}

		let style = props?.style || {width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center"};

		return(
			<View style={style}>
				{output}
			</View>
		)
	}

	const spacer = props?.spacer!==undefined ? props?.spacer : <SettingsSpacer/>;

	return (
		<View style={{width: "100%"}}>
			{renderMenuButtons()}
			{spacer}
			{element}
		</View>
	)

}
