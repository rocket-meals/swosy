import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {SettingsRowInner} from "../settings/SettingsRowInner";
import {Icon, MyActionsheet, useMyContrastColor} from "../../../kitcheningredients";
import {MyAlertProps} from "../../../kitcheningredients";
import {MyTouchableOpacity} from "./MyTouchableOpacity";
import {ColorHelper} from "../../helper/ColorHelper";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";

export interface AppState{
	color?: string,
	accessibilityLabel: string,
	isSelected?: boolean,
	label?: string
	hideSelection?: boolean,
	renderContent?: (backgroundColor, textColor) => any,
	activeColor?: string,
	onPress?: () => Promise<boolean | undefined>, // an async onPress function that returns a boolean or undefined
	onPressShowActionsheet?: [params: MyAlertProps, options?: any],
	element?: JSX.Element,
	iconName?: string,
	renderIcon?: (backgroundColor, textColor) => any,
	amount?: number,
	disabled?: boolean,
}
export const MyButton: FunctionComponent<AppState> = (props) => {

	const actionsheet = MyActionsheet.useActionsheet();

	// ToDo: Idea
	//			<ViewPercentageBorderradius style={{borderRadius: "5%", overflow: "hidden"}} >
	// 				<MyThemedBox _shadeLevel={disabledShadeLevel} >

	const defaultColor = ColorHelper.useProjectColor();
	let defaultActiveColor = ColorHelper.useDarkenProjectColor()

	if(props?.hideSelection) {
		defaultActiveColor = defaultColor;
	}

	let isSelected = props?.isSelected;

	let color = props?.color || defaultColor;
	let activeColor = props?.activeColor || defaultActiveColor;
	let usedBackgroundColor = color;
	if(isSelected && !props?.hideSelection){
		usedBackgroundColor = activeColor;
	}
	let textColor = useMyContrastColor(usedBackgroundColor);


	const actionsheetContent = props?.onPressShowActionsheet;
	const onPressMenu = props?.onPress;

	let amount = props?.amount;
	let amountText = "";
	if(amount!==undefined){
		amountText = " ("+amount+")";
	}

	let icon = props?.iconName;
	let renderedIcon = null;
	if(!!icon){
		renderedIcon = <Icon color={textColor} name={icon} />
	}
	if(props?.renderIcon){
		renderedIcon = props.renderIcon(usedBackgroundColor, textColor);
	}

	let additionalStyle = {};

	if(isSelected && !props?.hideSelection){
		let selectedStyle = {
			borderWidth: 2,
			borderColor: "white",
		}
		additionalStyle = selectedStyle;
	}

	let content = props?.children;
	if(props?.label){
		content = <Text color={textColor}>{props?.label}</Text>
	}
	if(props?.renderContent){
		content = props.renderContent(usedBackgroundColor, textColor);
	}


	return(
		<ViewPercentageBorderradius style={{marginHorizontal: 5, marginVertical: 5}}>
				<MyTouchableOpacity accessibilityLabel={props?.accessibilityLabel} disabled={props?.disabled} style={[{borderColor: "transparent", borderWidth: 2,justifyContent: "center", backgroundColor: usedBackgroundColor, borderRadius: 10}, additionalStyle]}
								  onPress={async () => {
									  if(actionsheetContent){
										  const params = actionsheetContent[0];
										  const options = actionsheetContent[1];
										  actionsheet.show(params, options);
									  } else {
										  if(onPressMenu){
											  await onPressMenu();
										  }
									  }
								  }}
				>
					<SettingsRowInner leftContent={content} leftIcon={renderedIcon} rightIcon={<Text color={textColor}>{amountText}</Text>} />
				</MyTouchableOpacity>
		</ViewPercentageBorderradius>
	)

}
