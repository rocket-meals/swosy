import React, {FunctionComponent, useEffect, useState} from "react";
import {Spacer, Text, useToast, View} from "native-base";
import {Linking, Platform, TouchableOpacity} from "react-native";
import {ViewPercentageBorderradius} from "../../../helper/ViewPercentageBorderradius";
import {Icon, useThemedShade} from "../../../../kitcheningredients";
import * as IntentLauncher from 'expo-intent-launcher';
import {SystemActionHelper} from "../../../helper/SystemActionHelper";

export const SystemSettingsLinks: FunctionComponent = (props) => {

	const themedBackground = useThemedShade(2);

	function renderButton(text, onPress){
		return(
			<TouchableOpacity style={{flex: 1, width: "70%", marginBottom: 10}} onPress={async () => {
				onPress();
			}}>
				<ViewPercentageBorderradius bg={themedBackground} style={{padding: 20 ,flex: 1, width: "100%", alignItems: "center", justifyContent: "center", borderRadius: "5%", flexDirection: "row"}}>
					<Text>{text}</Text>
				</ViewPercentageBorderradius>
			</TouchableOpacity>
		)
	}

	return(
		<>
			<View style={{width: "100%", height: "100%"}}>
				<Text>SystemSettingsLinks</Text>
				{renderButton("Open System App Settings (iOS & Android)", () => {SystemActionHelper.mobileSystemActionHelper.openSystemAppSettings()})}
				{renderButton("Open System Settings (iOS & Android)", () => {SystemActionHelper.mobileSystemActionHelper.openSystemSettings()})}
				{renderButton("Open NFC Settings (Android)", () => {SystemActionHelper.androidSystemActionHelper.openNFCSettings()})}
			</View>
		</>
	)
}
