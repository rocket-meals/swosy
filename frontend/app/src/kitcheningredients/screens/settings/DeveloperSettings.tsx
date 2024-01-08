// @ts-nocheck
import React, {useEffect, useState} from "react";
import {Button, Input, Pressable, Text, TextArea, View} from "native-base";
import {MyThemedBox} from "../../helper/MyThemedBox";
import {ConfigHolder} from "../../ConfigHolder";
import {SynchedVariable} from "../../storage/SynchedVariable";
import {SettingsValue} from "./SettingsValue";
import {RequiredStorageKeys} from "../../storage/RequiredStorageKeys";
import {ThemeChanger} from "../../theme/ThemeChanger";
import ServerAPI from "../../ServerAPI";
import {SynchedState} from "../../synchedstate/SynchedState";
import {keyof} from "ts-keyof";

export const DeveloperSettings = (props) => {

	// corresponding componentDidMount
	useEffect(() => {

	}, [props?.route?.params])

	function renderStorage(){
		let output = [];

		let requiredStorageKeys = SynchedState.getRequiredStorageKeys()
		console.log("requiredStorageKeys: ",requiredStorageKeys);

		let pluginStorageKeys = SynchedState.getPluginStorageKeys()
		let requiredSynchedStates = SynchedState.getRequiredSynchedStates()
		let pluginSynchedStates = SynchedState.getPluginSynchedStates();

		let allKeys = [];
		allKeys = allKeys.concat(requiredStorageKeys)
		allKeys = allKeys.concat(pluginStorageKeys)
		allKeys = allKeys.concat(requiredSynchedStates)
		allKeys = allKeys.concat(pluginSynchedStates)

		console.log("Render All Keys");
		console.log(allKeys)

		//console.log("renderStorage")
		for(let i=0; i<allKeys.length; i++){
			let storageKey = allKeys[i];
			console.log("renderStorage: storageKey: ", storageKey);
			if(storageKey===RequiredStorageKeys.CACHED_THEME){
				output.push(
					<MyThemedBox style={{margin: 5, padding: 5}} _shadeLevel={2} >
						<Text>{storageKey}</Text>
						<ThemeChanger><Text>{"Switch"}</Text></ThemeChanger>
					</MyThemedBox>
				)
			} else {
				output.push(
					<SynchedVariable storageKey={storageKey} key={storageKey}>
						<SettingsValue />
					</SynchedVariable>
				)
			}
		}

		return output;
	}

	function renderResetSettings(){
		return(
			<>
				<Text fontSize={30} bold={true}>DANGER:</Text>
				<MyThemedBox style={{margin: 5, padding: 5}} _shadeLevel={2} >
					<Text>{"Reset App"}</Text>
					<Button onPress={async () => {
						await ServerAPI.handleLogout()
						ConfigHolder.instance.storage.deleteAll();
						}}><Text>{"Delete"}</Text></Button>
				</MyThemedBox>
			</>
		)
	}

	return(
		<>
			<View>
				<MyThemedBox>
					<Text fontSize={30} bold={true}>STORAGE:</Text>
					{renderStorage()}
				</MyThemedBox>
				{renderResetSettings()}
			</View>
		</>
	)
}

DeveloperSettings.displayName = keyof({ DeveloperSettings });
