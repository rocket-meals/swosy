import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {DetailsComponentMenus} from "../../../components/detailsComponent/DetailsComponentMenus";
import {NutritionIcon} from "../../../components/food/nutritions/NutritionIcon";
import {useAppTranslation} from "../../../components/translations/AppTranslation";
import {Icon} from "../../../../kitcheningredients";
import {SettingsRow} from "../../../components/settings/SettingsRow";
import {SettingsSpacer} from "../../../components/settings/SettingsSpacer";
import {MyButton} from "../../../components/buttons/MyButton";

export const ExampleSettingsRow: FunctionComponent = (props) => {

	const translationCreate = useAppTranslation("create");
	const translationEvent = useAppTranslation("event");
	const translationCreateEvent = translationEvent+" "+translationCreate

	const content = <View>
		<Text>{"Hi my name is a long text"}</Text>
	</View>

	const menus = {
		"nutritions": {
			element: <View></View>,
			renderIcon: (backgroundColor, textColor) => { return <Icon name={"chat"} color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return content},
		},
		"markings": {
			element: <View></View>,
			renderIcon: (backgroundColor, textColor) => { return <NutritionIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return content},
			color: "red",
			activeColor: "darkred",
			amount: 5
		},
		"comments": {
			element: <View></View>,
			renderIcon: (backgroundColor, textColor) => { return <NutritionIcon color={textColor} />},
			renderContent: (backgroundColor, textColor) => { return content},
		},
	}

	return(
		<>
			<View style={{width: "100%", height: "100%"}}>
				<Text>{"Settings Row with Right Content"}</Text>
				<SettingsRow leftContent={"RC with a long content which soud be wrapped"} rightContent={"RC with a long content which soud be wrapped"} leftIcon={"chat"} onPress={() => {}} />
				<SettingsSpacer />
				<View style={{width: "100%", flexDirection: "row"}}>
					<View style={{flex: 1}}>
						<MyButton iconName={"calendar-import"} accessibilityLabel={"Import timetable"} label={"Import timetable"} >
						</MyButton>
					</View>
					<View style={{flex: 1}}>
						<MyButton iconName={"calendar-plus"} onPress={() => {

						}} accessibilityLabel={translationCreateEvent} label={translationCreateEvent}>
						</MyButton>
					</View>
				</View>
				<SettingsSpacer />
				<Text>{"SettingsRow columns"}</Text>
				<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
				<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
				<SettingsSpacer />
				<Text>{"SettingsRow in views in flexRow"}</Text>
				<View style={{flexDirection: "row", flexWrap: "wrap", width: "100%", backgroundColor: "red"}}>
					<View style={{flex: 1}}>
						<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
					</View>
					<View style={{flex: 1}}>
						<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
					</View>
				</View>
				<SettingsSpacer />
				<Text>{"SettingsRow in flexRow"}</Text>
				<View style={{flexDirection: "row", width: "100%", backgroundColor: "red"}}>
					<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
					<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
				</View>
				<SettingsSpacer />
				<Text>{"SettingsRow in flexRow with flexWrap"}</Text>
				<View style={{flexDirection: "row", flexWrap: "wrap", width: "100%", backgroundColor: "red"}}>
					<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
					<SettingsRow leftContent={content} leftIcon={"chat"} onPress={() => {}} />
				</View>
				<SettingsSpacer />
				<Text>{"DetailsComponentMenus"}</Text>
				<DetailsComponentMenus menus={menus} />
				<SettingsSpacer />
				<Text>{"MyButton in column"}</Text>
				<MyButton iconName={"chat"} >{content}</MyButton>
				<MyButton iconName={"chat"} >{content}</MyButton>
				<SettingsSpacer />
				<Text>{"MyButton in flexRow"}</Text>
				<View style={{flexDirection: "row", width: "100%", backgroundColor: "red"}}>
					<MyButton iconName={"chat"} >{content}</MyButton>
					<MyButton iconName={"chat"} >{content}</MyButton>
				</View>
				<SettingsSpacer />
				<Text>{"MyButton in flexRow with flexWrap"}</Text>
				<View style={{flexDirection: "row", flexWrap: "wrap", width: "100%", backgroundColor: "red"}}>
					<MyButton iconName={"chat"} >{content}</MyButton>
					<MyButton iconName={"chat"} >{content}</MyButton>
				</View>
				<SettingsSpacer />
			</View>
		</>
	)
}
