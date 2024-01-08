import React, {FunctionComponent} from "react";
import {SettingsRow} from "../../settings/SettingsRow";
import {StringHelper} from "../../../helper/StringHelper";
import {Text, View} from "native-base";
import {SpeicificNutritionIcon} from "./SpeicificNutritionIcon";
import {useAppTranslation} from "../../translations/AppTranslation";

export enum NutritionKeys{
	calories_kcal= "calories_kcal"
}

export interface AppState {
	icon?: any,
	nutritionkey: string,
	value: string,
}
export const Nutrition: FunctionComponent<AppState> = (props) => {

	let text = useAppTranslation(props?.nutritionkey) || "?"

	let isKcal = props?.nutritionkey===NutritionKeys.calories_kcal

	let value = props.value
	let valueWithUnit = "";
	if(value===null || value===undefined){
		valueWithUnit = "?";
	} else if (isKcal){
		valueWithUnit = value;
	} else {
		valueWithUnit = value+StringHelper.NONBREAKING_SPACE+"g";
	}

	let amountOfLines = 2

	function renderSpacer(){
		let spacer = [];
		for(let i=0; i<amountOfLines; i++){
			spacer.push(<Text key={i+""}>{StringHelper.EMPTY_SPACE}</Text>)
		}
		return 	<View style={{opacity: 0}}>
			{spacer}
		</View>;
	}

	function renderContent(): JSX.Element{
			return(
				<View
					style={{flexGrow: 1}}>
					<Text key={"nutritionValue"}>{valueWithUnit}</Text>
					<View style={{flexDirection: "row"}}>
						{renderSpacer()}
						<Text key={"nutritionText"} italic={true} numberOfLines={amountOfLines} >{text}</Text>
					</View>
				</View>
			)
	}

	/**
	 <Text style={{flexWrap: 'wrap'}} numberOfLines={amountOfLines} italic={true} fontSize={"sm"} >{text+" "+text}</Text>
	 */

	return(
		<View style={{flex: 1}}>
			<SettingsRow leftContent={renderContent()} customDivider={null} leftIcon={
				<View style={{marginTop: 0, marginBottom: 0, flex: 1}}>
					<View style={{flex: 1}}>
						<SpeicificNutritionIcon nutritionkey={props.nutritionkey} contentSpacer={
							<View>
								<Text>{"MM"}</Text>
							</View>
						} />
					</View>
				</View>
			} />
		</View>
	)
}
